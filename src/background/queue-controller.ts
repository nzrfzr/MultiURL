import {
  OpenMode,
  QueueSessionState,
  UrlEntry,
} from '../core/types';
import {
  DEFAULT_INTERVAL_SECONDS,
  DEFAULT_LIMIT,
  validateLimit,
} from '../core/scheduler';
import {
  createTab,
  onTabRemoved,
  onTabUpdated,
  onTabReplaced,
  isTabAlive,
} from '../platform/browser-api';
import { saveSessionState, loadSessionState } from './queue-repository';

// ---------------------------------------------------------------------------
// Chrome Alarms helpers — used so interval timer and queue watchdog survive
// service worker termination. chrome.alarms wake the SW even if it was killed.
// ---------------------------------------------------------------------------
const ALARM_NAME = 'multiurls_tick';
const WATCHDOG_ALARM_NAME = 'multiurls_watchdog';

function scheduleAlarm(delaySeconds: number): void {
  if (typeof chrome !== 'undefined' && chrome.alarms?.create) {
    chrome.alarms.clear(ALARM_NAME, () => {
      // delayInMinutes minimum is ~0.1 min (6s) on Chrome, so we clamp.
      const delayMinutes = Math.max(0.1, delaySeconds / 60);
      chrome.alarms.create(ALARM_NAME, { delayInMinutes: delayMinutes });
    });
  }
}

function clearAlarm(): void {
  if (typeof chrome !== 'undefined' && chrome.alarms?.clear) {
    chrome.alarms.clear(ALARM_NAME);
  }
}

export class QueueController {
  private state: QueueSessionState;
  private timerId: NodeJS.Timeout | null = null;
  private watchdogTimerId: NodeJS.Timeout | null = null;
  private pendingTimerResolver: (() => void) | null = null;
  private tabRemovedUnsub: (() => void) | null = null;
  private tabReplacedUnsub: (() => void) | null = null;
  private isProcessing = false;
  private pendingRefill = false;
  private listeners: Set<(state: QueueSessionState) => void> = new Set();
  private pendingLoadResolver: (() => void) | null = null;
  private currentRunId = 0;
  // Used by interval/after_load modes to signal that the alarm fired and the
  // next URL should be dispatched without waiting for the setTimeout.
  private alarmTickResolver: (() => void) | null = null;

  // Initialization gate: ensures SW restoration completes before messages/events are handled
  private isReady = false;
  private readyPromise: Promise<void>;
  private resolveReady!: () => void;

  constructor() {
    this.state = this.getInitialState();
    this.readyPromise = new Promise<void>((resolve) => {
      this.resolveReady = resolve;
    });
    this.setupListeners();
    this.init().catch((err) => {
      console.warn('[MultiURL] Controller init error:', err);
    });
  }

  public async whenReady(): Promise<void> {
    if (this.isReady) return;
    await this.readyPromise;
  }

  public async init(): Promise<void> {
    try {
      const saved = await loadSessionState();
      this.isReady = true;
      if (this.resolveReady) {
        this.resolveReady();
      }
      if (this.state.status === 'idle' && saved) {
        if (saved.status === 'running' || saved.status === 'paused') {
          console.log('[MultiURL] Restoring session from storage, status:', saved.status);
          await this.restoreAndResume(saved);
        } else {
          this.state = { ...saved };
        }
      }
    } catch (err) {
      console.warn('[MultiURL] Failed to load session state in init:', err);
      this.isReady = true;
      if (this.resolveReady) {
        this.resolveReady();
      }
    }
  }

  private getInitialState(): QueueSessionState {
    return {
      sessionId: '',
      status: 'idle',
      mode: 'open_all',
      delaySeconds: DEFAULT_INTERVAL_SECONDS,
      limit: DEFAULT_LIMIT,
      entries: [],
      nextIndex: 0,
      managedTabIds: [],
      tabToEntryIdMap: {},
      entryOutcomes: {},
      statusMessage: 'Ready to open URLs',
      updatedAt: Date.now(),
    };
  }

  public getState(): QueueSessionState {
    return { ...this.state };
  }

  public subscribe(listener: (state: QueueSessionState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.state.updatedAt = Date.now();
    saveSessionState(this.state).catch((err) =>
      console.warn('Failed to persist session state:', err)
    );
    for (const listener of this.listeners) {
      listener(this.getState());
    }
  }

  private setupListeners() {
    // Tab removal listener for Queue Mode
    this.tabRemovedUnsub = onTabRemoved((tabId) => {
      this.handleTabRemoved(tabId).catch((err) =>
        console.warn('[MultiURL] handleTabRemoved error:', err)
      );
    });

    // Tab replacement listener (e.g. process swap / prerender in Chrome)
    this.tabReplacedUnsub = onTabReplaced((addedTabId, removedTabId) => {
      this.handleTabReplaced(addedTabId, removedTabId);
    });
  }

  private handleTabReplaced(addedTabId: number, removedTabId: number): void {
    const idx = this.state.managedTabIds.indexOf(removedTabId);
    if (idx !== -1) {
      this.state.managedTabIds[idx] = addedTabId;
      const entryId = this.state.tabToEntryIdMap[removedTabId];
      if (entryId) {
        delete this.state.tabToEntryIdMap[removedTabId];
        this.state.tabToEntryIdMap[addedTabId] = entryId;
      }
      this.notify();
    }
  }

  private startWatchdog() {
    this.stopWatchdog();

    // 1. Chrome alarm periodically wakes the SW even if killed (approx every 12-15s)
    if (typeof chrome !== 'undefined' && chrome.alarms?.create) {
      chrome.alarms.create(WATCHDOG_ALARM_NAME, { periodInMinutes: 0.2 });
    }

    // 2. High-frequency in-memory interval while worker is active (every 2.5s)
    this.watchdogTimerId = setInterval(() => {
      this.checkAndReconcileQueue().catch((err) =>
        console.warn('[MultiURL] Watchdog reconcile error:', err)
      );
    }, 2500);
  }

  private stopWatchdog() {
    if (this.watchdogTimerId) {
      clearInterval(this.watchdogTimerId);
      this.watchdogTimerId = null;
    }
    if (typeof chrome !== 'undefined' && chrome.alarms?.clear) {
      chrome.alarms.clear(WATCHDOG_ALARM_NAME);
    }
  }

  /**
   * Reconciles managed tabs against live browser tabs.
   * Cleans up dead tabs and refills queue slots if capacity opened up.
   */
  public async checkAndReconcileQueue(): Promise<void> {
    await this.whenReady();
    if (this.state.status !== 'running' || this.state.mode !== 'queue') {
      return;
    }

    const currentTabs = [...this.state.managedTabIds];
    const checkResults = await Promise.all(
      currentTabs.map(async (id) => ({ id, alive: await isTabAlive(id) }))
    );

    const liveTabs: number[] = [];
    for (const res of checkResults) {
      if (res.alive) {
        liveTabs.push(res.id);
      } else {
        delete this.state.tabToEntryIdMap[res.id];
      }
    }

    const hadDeadTabs = liveTabs.length !== this.state.managedTabIds.length;
    this.state.managedTabIds = liveTabs;

    const remaining = this.state.entries.length - this.state.nextIndex;
    if (remaining === 0 && this.state.managedTabIds.length === 0) {
      this.state.status = 'completed';
      this.state.statusMessage = 'All URLs completed and managed tabs closed';
      this.stopWatchdog();
      this.notify();
      return;
    }

    if (this.state.managedTabIds.length < this.state.limit && remaining > 0) {
      await this.processNextBatch();
    } else if (hadDeadTabs) {
      this.notify();
    }
  }

  public destroy() {
    this.currentRunId++;
    clearAlarm();
    this.stopWatchdog();
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.pendingTimerResolver) {
      this.pendingTimerResolver();
      this.pendingTimerResolver = null;
    }
    if (this.tabRemovedUnsub) this.tabRemovedUnsub();
    if (this.tabReplacedUnsub) this.tabReplacedUnsub();
    if (this.pendingLoadResolver) {
      this.pendingLoadResolver();
      this.pendingLoadResolver = null;
    }
    this.isProcessing = false;
    this.pendingRefill = false;
    this.listeners.clear();
  }

  public async start(
    mode: OpenMode,
    entries: UrlEntry[],
    delaySeconds: number,
    limit: number
  ) {
    await this.whenReady();
    this.currentRunId++;
    clearAlarm();
    this.stopWatchdog();
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.pendingTimerResolver) {
      this.pendingTimerResolver();
      this.pendingTimerResolver = null;
    }
    if (this.pendingLoadResolver) {
      this.pendingLoadResolver();
      this.pendingLoadResolver = null;
    }
    if (this.alarmTickResolver) {
      this.alarmTickResolver();
      this.alarmTickResolver = null;
    }
    this.isProcessing = false;
    this.pendingRefill = false;

    const validLimit = validateLimit(limit).value;
    const initialOutcomes: Record<string, 'queued'> = {};
    entries.forEach((e) => {
      initialOutcomes[e.id] = 'queued';
    });

    this.state = {
      sessionId: `session_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      status: 'running',
      mode,
      delaySeconds: Math.max(0.5, delaySeconds),
      limit: validLimit,
      entries,
      nextIndex: 0,
      managedTabIds: [],
      tabToEntryIdMap: {},
      entryOutcomes: initialOutcomes,
      statusMessage: 'Opening URLs...',
      startedAt: Date.now(),
      updatedAt: Date.now(),
    };

    if (mode === 'queue') {
      this.startWatchdog();
    }

    this.notify();
    await this.processNextBatch();
  }

  /**
   * Restore a previously persisted session (e.g. after service worker restart)
   * and resume processing if the session was running.
   */
  public async restoreAndResume(saved: QueueSessionState): Promise<void> {
    this.currentRunId++;
    clearAlarm();
    this.stopWatchdog();
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.pendingTimerResolver) {
      this.pendingTimerResolver();
      this.pendingTimerResolver = null;
    }
    if (this.alarmTickResolver) {
      this.alarmTickResolver();
      this.alarmTickResolver = null;
    }
    this.isProcessing = false;
    this.pendingRefill = false;

    // Adopt the persisted state.
    this.state = { ...saved };

    if (this.state.status === 'running') {
      if (this.state.mode === 'queue') {
        this.startWatchdog();
      }
      this.state.statusMessage = 'Resuming after browser restart...';
      this.notify();
      await this.processNextBatch();
    } else {
      this.notify();
    }
  }

  /**
   * Called by the chrome.alarms listener in index.ts when the
   * 'multiurls_tick' alarm fires. Resolves the pending wait promise so the
   * interval/after_load loop can dispatch the next URL.
   */
  public handleAlarmTick(): void {
    console.log('[MultiURL] Alarm tick received');
    if (this.alarmTickResolver) {
      const resolve = this.alarmTickResolver;
      this.alarmTickResolver = null;
      resolve();
    } else if (!this.isProcessing && this.state.status === 'running') {
      // Service worker was restarted by the alarm — resume processing.
      this.processNextBatch().catch((err) =>
        console.error('[MultiURL] handleAlarmTick processNextBatch error:', err)
      );
    }
  }

  public pause() {
    if (this.state.status !== 'running') return;
    clearAlarm();
    this.stopWatchdog();
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.pendingTimerResolver) {
      this.pendingTimerResolver();
      this.pendingTimerResolver = null;
    }
    if (this.pendingLoadResolver) {
      this.pendingLoadResolver();
      this.pendingLoadResolver = null;
    }
    if (this.alarmTickResolver) {
      this.alarmTickResolver();
      this.alarmTickResolver = null;
    }
    this.isProcessing = false;
    this.pendingRefill = false;
    this.state.status = 'paused';
    this.state.statusMessage = 'Paused — Tabs remain open';
    this.notify();
  }

  public resume() {
    if (this.state.status !== 'paused') return;
    this.state.status = 'running';
    this.state.statusMessage = 'Resuming...';
    if (this.state.mode === 'queue') {
      this.startWatchdog();
    }
    this.notify();
    this.processNextBatch();
  }

  public stop() {
    this.currentRunId++;
    clearAlarm();
    this.stopWatchdog();
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.pendingTimerResolver) {
      this.pendingTimerResolver();
      this.pendingTimerResolver = null;
    }
    if (this.pendingLoadResolver) {
      this.pendingLoadResolver();
      this.pendingLoadResolver = null;
    }
    if (this.alarmTickResolver) {
      this.alarmTickResolver();
      this.alarmTickResolver = null;
    }
    this.isProcessing = false;
    this.pendingRefill = false;
    this.state.status = 'stopped';
    this.state.statusMessage = 'Stopped by user — Opened tabs preserved';
    this.notify();
  }

  public updateLimit(newLimit: number) {
    const valid = validateLimit(newLimit).value;
    const oldLimit = this.state.limit;
    this.state.limit = valid;
    this.notify();

    // If running in queue mode and capacity opened up (limit increased), refill
    if (
      this.state.status === 'running' &&
      this.state.mode === 'queue' &&
      valid > oldLimit
    ) {
      this.processNextBatch();
    }
  }

  private async handleTabRemoved(tabId: number) {
    await this.whenReady();

    const idx = this.state.managedTabIds.indexOf(tabId);
    if (idx === -1) {
      return; // Not our managed tab, ignore cleanly
    }

    this.state.managedTabIds.splice(idx, 1);
    delete this.state.tabToEntryIdMap[tabId];

    const remaining = this.state.entries.length - this.state.nextIndex;
    if (remaining === 0 && this.state.managedTabIds.length === 0) {
      if (this.state.status === 'running') {
        this.state.status = 'completed';
        this.state.statusMessage = 'All URLs completed and managed tabs closed';
        this.stopWatchdog();
        this.notify();
      }
      return;
    }

    if (this.state.status === 'running' && this.state.mode === 'queue') {
      await this.processNextBatch();
    } else {
      this.notify();
    }
  }

  private async processNextBatch() {
    if (this.state.status !== 'running') return;
    if (this.isProcessing) {
      this.pendingRefill = true;
      return;
    }
    this.isProcessing = true;

    try {
      do {
        this.pendingRefill = false;
        if (this.state.status !== 'running') break;

        if (this.state.mode === 'open_all') {
          await this.runOpenAll();
        } else if (this.state.mode === 'interval') {
          await this.runInterval();
        } else if (this.state.mode === 'after_load') {
          await this.runAfterLoad();
        } else if (this.state.mode === 'queue') {
          await this.runQueueRefill();
        }
      } while (this.pendingRefill && this.state.status === 'running');
    } finally {
      this.isProcessing = false;
    }
  }

  private async dispatchUrl(entry: UrlEntry): Promise<number | null> {
    this.state.entryOutcomes[entry.id] = 'opening';
    this.notify();

    try {
      const tabId = await createTab(entry.normalizedUrl);
      this.state.entryOutcomes[entry.id] = 'opened';
      return tabId;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`Failed to open tab for ${entry.normalizedUrl}:`, msg);
      this.state.entryOutcomes[entry.id] = 'failed';
      this.state.lastError = msg;
      return null;
    }
  }

  private async runOpenAll() {
    const runId = this.currentRunId;
    while (
      this.state.status === 'running' &&
      this.currentRunId === runId &&
      this.state.nextIndex < this.state.entries.length
    ) {
      const entry = this.state.entries[this.state.nextIndex];
      this.state.nextIndex++;
      await this.dispatchUrl(entry);
    }

    if (
      this.state.nextIndex >= this.state.entries.length &&
      this.state.status === 'running' &&
      this.currentRunId === runId
    ) {
      this.state.status = 'completed';
      this.state.statusMessage = 'All URLs opened successfully';
      this.notify();
    }
  }

  private async runInterval() {
    const runId = this.currentRunId;
    while (
      this.state.status === 'running' &&
      this.currentRunId === runId &&
      this.state.nextIndex < this.state.entries.length
    ) {
      const entry = this.state.entries[this.state.nextIndex];
      this.state.nextIndex++;

      await this.dispatchUrl(entry);

      if (this.state.status !== 'running' || this.currentRunId !== runId) break;

      if (this.state.nextIndex < this.state.entries.length) {
        const delaySecs = this.state.delaySeconds;
        this.state.statusMessage = `Waiting ${delaySecs}s before next URL...`;
        this.notify();

        // Schedule a chrome.alarms as a keep-alive so the service worker
        // is woken up even if the browser kills it during the wait.
        scheduleAlarm(delaySecs);

        await new Promise<void>((resolve) => {
          this.alarmTickResolver = resolve;
          // Also use setTimeout as primary path (faster for short delays
          // since alarms have a 6s minimum).
          this.pendingTimerResolver = resolve;
          this.timerId = setTimeout(() => {
            this.timerId = null;
            this.pendingTimerResolver = null;
            // Clear alarm since setTimeout won
            clearAlarm();
            if (this.alarmTickResolver === resolve) {
              this.alarmTickResolver = null;
            }
            resolve();
          }, delaySecs * 1000);
        });
      }
    }

    if (
      this.state.nextIndex >= this.state.entries.length &&
      this.state.status === 'running' &&
      this.currentRunId === runId
    ) {
      clearAlarm();
      this.state.status = 'completed';
      this.state.statusMessage = 'All URLs opened successfully';
      this.notify();
    }
  }

  /**
   * Waits for a created tab to report status === 'complete' or 8s timeout safeguard.
   */
  private waitForTabToLoad(tabId: number, timeoutMs = 8000): Promise<void> {
    return new Promise<void>((resolve) => {
      let isDone = false;
      let cleanupUpdated: (() => void) | null = null;
      let cleanupRemoved: (() => void) | null = null;
      let timer: NodeJS.Timeout | null = null;

      const finish = () => {
        if (!isDone) {
          isDone = true;
          if (cleanupUpdated) cleanupUpdated();
          if (cleanupRemoved) cleanupRemoved();
          if (timer) clearTimeout(timer);
          this.pendingLoadResolver = null;
          resolve();
        }
      };

      this.pendingLoadResolver = finish;

      // 1. Safety timeout
      timer = setTimeout(finish, timeoutMs);

      // 2. Check if already loaded immediately
      if (typeof chrome !== 'undefined' && chrome.tabs?.get) {
        chrome.tabs.get(tabId, (tab) => {
          if (!chrome.runtime?.lastError && tab?.status === 'complete') {
            finish();
          }
        });
      }

      // 3. Listen for onUpdated status === 'complete'
      cleanupUpdated = onTabUpdated((updatedId, status) => {
        if (updatedId === tabId && status === 'complete') {
          finish();
        }
      });

      // 4. Also listen for onRemoved so if tab is closed early, we don't stall!
      cleanupRemoved = onTabRemoved((removedId) => {
        if (removedId === tabId) {
          finish();
        }
      });
    });
  }

  private async runAfterLoad() {
    const runId = this.currentRunId;
    while (
      this.state.status === 'running' &&
      this.currentRunId === runId &&
      this.state.nextIndex < this.state.entries.length
    ) {
      const entry = this.state.entries[this.state.nextIndex];
      this.state.nextIndex++;

      this.state.statusMessage = `Opening (${this.state.nextIndex}/${this.state.entries.length}): ${entry.normalizedUrl}`;
      this.notify();

      const tabId = await this.dispatchUrl(entry);

      if (this.state.status !== 'running' || this.currentRunId !== runId) break;

      // If more URLs remain and tab was created, wait for page load with safeguard
      if (tabId && this.state.nextIndex < this.state.entries.length) {
        this.state.statusMessage = `Waiting for page load (${this.state.nextIndex}/${this.state.entries.length}): ${entry.normalizedUrl}`;
        this.notify();

        await this.waitForTabToLoad(tabId, 8000);
      }
    }

    if (
      this.state.nextIndex >= this.state.entries.length &&
      this.state.status === 'running' &&
      this.currentRunId === runId
    ) {
      this.state.status = 'completed';
      this.state.statusMessage = 'All URLs opened successfully';
      this.notify();
    }
  }

  private async runQueueRefill() {
    const runId = this.currentRunId;
    if (this.state.status !== 'running' || this.currentRunId !== runId) return;

    // Open URLs while capacity is available and URLs remain
    while (
      this.state.status === 'running' &&
      this.currentRunId === runId &&
      this.state.managedTabIds.length < this.state.limit &&
      this.state.nextIndex < this.state.entries.length
    ) {
      const entry = this.state.entries[this.state.nextIndex];
      this.state.nextIndex++;

      const tabId = await this.dispatchUrl(entry);
      if (tabId) {
        this.state.managedTabIds.push(tabId);
        this.state.tabToEntryIdMap[tabId] = entry.id;
      }
    }

    const queueExhausted = this.state.nextIndex >= this.state.entries.length;
    const liveCount = this.state.managedTabIds.length;

    if (queueExhausted) {
      if (liveCount > 0) {
        this.state.statusMessage = `All URLs opened — ${liveCount} managed tab${
          liveCount > 1 ? 's' : ''
        } still open`;
      } else {
        this.state.status = 'completed';
        this.state.statusMessage = 'All URLs opened and managed tabs closed';
        this.stopWatchdog();
      }
    } else {
      this.state.statusMessage = `Queue running: ${liveCount}/${this.state.limit} slots active`;
    }

    this.notify();
  }
}
