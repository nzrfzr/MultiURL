/**
 * MultiURL — Process Widget (Content Script)
 *
 * Spacious, neat floating card at the bottom-right corner.
 * Displays rich process details matching the extension's progress panel:
 *   - Status badge and pulsing indicator
 *   - Full-width progress bar with percentage and ratio
 *   - Queue mode active slots
 *   - Success, Failed, Remaining stats chips
 *   - Real-time status text
 *   - Dedicated action buttons (Pause/Resume, Stop) with generous padding and clean spacing
 *   - Minimize to a sleek compact corner pill
 */

import type { QueueSessionState } from '../core/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContentMessage {
  type: 'MULTIURL_STATE_UPDATE';
  state: QueueSessionState;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const HOST_ID  = 'mul-host';
const STYLE_ID = 'mul-styles';

const STATUS_CFG = {
  running: { label: 'Running', dotColor: '#2563EB', pillBg: '#EFF6FF', pillBorder: '#DBEAFE', pillText: '#2563EB' },
  paused:  { label: 'Paused',  dotColor: '#D97706', pillBg: '#FFFBEB', pillBorder: '#FDE68A', pillText: '#D97706' },
} as const;

// ─── State ────────────────────────────────────────────────────────────────────

let minimized = false;
let keepAlivePort: chrome.runtime.Port | null = null;

function maintainKeepAlive(): void {
  if (typeof chrome === 'undefined' || !chrome.runtime?.connect) return;
  try {
    if (!keepAlivePort) {
      keepAlivePort = chrome.runtime.connect({ name: 'multiurl_keepalive' });
      keepAlivePort.onDisconnect.addListener(() => {
        keepAlivePort = null;
      });
    }
  } catch {
    // safe to ignore
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
    /* ── Host: fixed, bottom-right ── */
    #${HOST_ID} {
      all: initial;
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 2147483647;
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
      font-size: 12px;
      color: #0F172A;
      user-select: none;
      pointer-events: auto;
    }
    #${HOST_ID} * { box-sizing: border-box; margin: 0; padding: 0; }

    /* ── Expanded Card ── */
    #mul-card {
      width: 360px;
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 14px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08);
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 11px;
      transition: box-shadow 0.2s, transform 0.2s;
      animation: mul-in 0.24s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }
    #mul-card:hover {
      box-shadow: 0 14px 28px -4px rgba(0, 0, 0, 0.16), 0 10px 12px -5px rgba(0, 0, 0, 0.10);
    }

    /* ── Header Row ── */
    .mul-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #F1F5F9;
      padding-bottom: 9px;
    }
    .mul-header-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* ── Dot Indicator ── */
    #mul-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    #mul-dot.running {
      animation: mul-blink 1.8s ease-in-out infinite;
    }
    @keyframes mul-blink {
      0%, 100% { opacity: 1; transform: scale(1); }
      50%       { opacity: 0.35; transform: scale(0.9); }
    }

    /* ── App name ── */
    #mul-name {
      font-size: 13px;
      font-weight: 700;
      color: #0F172A;
      letter-spacing: -0.01em;
      flex-shrink: 0;
    }

    /* ── Status pill ── */
    #mul-pill {
      display: inline-flex;
      align-items: center;
      border-radius: 9999px;
      border-width: 1px;
      border-style: solid;
      padding: 2px 8px;
      font-size: 10px;
      font-weight: 600;
      flex-shrink: 0;
    }

    /* ── Minimize Toggle Button ── */
    #mul-toggle {
      all: unset;
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: 6px;
      color: #94A3B8;
      cursor: pointer;
      font-size: 16px;
      line-height: 1;
      transition: background 0.12s, color 0.12s;
    }
    #mul-toggle:hover {
      background: #F1F5F9;
      color: #334155;
    }

    /* ── Progress Section ── */
    .mul-progress-section {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .mul-progress-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11.5px;
    }
    .mul-progress-label {
      font-weight: 600;
      color: #0F172A;
    }
    #mul-pct {
      font-weight: 700;
      color: #2563EB;
      margin-left: 5px;
    }
    .mul-progress-counts {
      color: #64748B;
      font-variant-numeric: tabular-nums;
    }
    #mul-active-slots {
      margin-left: 5px;
      color: #2563EB;
      font-weight: 600;
    }

    /* ── Progress Bar Track ── */
    #mul-track {
      width: 100%;
      height: 6px;
      background: #EEF2F6;
      border-radius: 9999px;
      overflow: hidden;
      flex-shrink: 0;
    }
    #mul-fill {
      height: 100%;
      width: 0%;
      background: #2563EB;
      border-radius: 9999px;
      transition: width 0.25s ease-out;
    }

    /* ── Stats Breakdown Row ── */
    .mul-stats-row {
      display: flex;
      gap: 8px;
    }
    .mul-stat-chip {
      flex: 1;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 7px;
      padding: 6px 8px;
      text-align: center;
    }
    .mul-stat-title {
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
      color: #64748B;
      line-height: 1;
    }
    .mul-stat-val {
      font-size: 13.5px;
      font-weight: 700;
      color: #0F172A;
      margin-top: 3px;
      line-height: 1.2;
      font-variant-numeric: tabular-nums;
    }
    .mul-stat-chip.failed.has-errors {
      background: #FEF2F2;
      border-color: #FECACA;
    }
    .mul-stat-chip.failed.has-errors .mul-stat-title,
    .mul-stat-chip.failed.has-errors .mul-stat-val {
      color: #DC2626;
    }

    /* ── Status Message Row ── */
    #mul-status-msg {
      font-size: 11px;
      color: #64748B;
      font-style: italic;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      padding-top: 3px;
      border-top: 1px solid #F8FAFC;
      line-height: 1.3;
    }

    /* ── Dedicated Action Controls Row: Spacious, Clean, Roomy ── */
    .mul-actions-row {
      display: flex;
      gap: 10px;
      margin-top: 2px;
      width: 100%;
    }

    .mul-btn {
      all: unset;
      box-sizing: border-box;
      flex: 1;
      height: 32px;
      padding: 0 16px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid #CBD5E1;
      background: #FFFFFF;
      color: #334155;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease, transform 0.05s ease;
      line-height: 1;
      text-align: center;
      letter-spacing: 0.01em;
    }
    .mul-btn:hover {
      background: #F8FAFC;
      color: #0F172A;
      border-color: #94A3B8;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
    }
    .mul-btn:active {
      transform: scale(0.98);
    }
    .mul-btn.resume {
      background: #FFFBEB;
      color: #D97706;
      border-color: #FDE68A;
    }
    .mul-btn.resume:hover {
      background: #FEF3C7;
      border-color: #F59E0B;
      color: #B45309;
    }
    .mul-btn.stop {
      background: #FEF2F2;
      color: #DC2626;
      border-color: #FECACA;
    }
    .mul-btn.stop:hover {
      background: #FEE2E2;
      color: #B91C1C;
      border-color: #F87171;
    }

    /* ── Minimized State: Sleek Corner Pill ── */
    #mul-card.minimized {
      width: auto;
      max-width: 260px;
      padding: 6px 12px;
      border-radius: 9999px;
      cursor: pointer;
      flex-direction: row;
      align-items: center;
      gap: 8px;
      white-space: nowrap;
    }
    #mul-card.minimized .mul-header-row {
      border-bottom: none;
      padding-bottom: 0;
      width: 100%;
      justify-content: flex-start;
      gap: 8px;
    }
    #mul-card.minimized #mul-toggle,
    #mul-card.minimized .mul-progress-section,
    #mul-card.minimized .mul-stats-row,
    #mul-card.minimized #mul-status-msg,
    #mul-card.minimized .mul-actions-row {
      display: none !important;
    }
    #mul-min-info {
      display: none;
      font-size: 11px;
      font-weight: 600;
      color: #0F172A;
      align-items: center;
      gap: 6px;
    }
    #mul-card.minimized #mul-min-info {
      display: inline-flex;
    }
    .mul-expand-icon {
      font-size: 11px;
      color: #94A3B8;
      margin-left: 2px;
    }

    /* ── Slide-in Animation ── */
    @keyframes mul-in {
      from { opacity: 0; transform: translateY(12px) scale(0.96); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
  `;
  document.documentElement.appendChild(s);
}

// ─── Widget DOM ───────────────────────────────────────────────────────────────

function getOrCreate(): HTMLElement {
  const ex = document.getElementById(HOST_ID);
  if (ex) return ex;

  injectStyles();

  const host = document.createElement('div');
  host.id = HOST_ID;
  host.innerHTML = `
    <div id="mul-card">
      <!-- 1. Header -->
      <div class="mul-header-row">
        <div class="mul-header-left">
          <span id="mul-dot"></span>
          <span id="mul-name">MultiURL</span>
          <span id="mul-pill"></span>
          <div id="mul-min-info">
            <span id="mul-min-counts">0/0</span>
            <span class="mul-expand-icon" title="Click to expand">↗</span>
          </div>
        </div>
        <button id="mul-toggle" title="Minimize">&minus;</button>
      </div>

      <!-- 2. Progress Section -->
      <div class="mul-progress-section">
        <div class="mul-progress-meta">
          <div>
            <span class="mul-progress-label">Progress</span>
            <span id="mul-pct">0%</span>
          </div>
          <div class="mul-progress-counts">
            <span id="mul-dispatched">0</span> / <span id="mul-total">0</span> opened
            <span id="mul-active-slots"></span>
          </div>
        </div>
        <div id="mul-track">
          <div id="mul-fill"></div>
        </div>
      </div>

      <!-- 3. Stats Row -->
      <div class="mul-stats-row">
        <div class="mul-stat-chip">
          <div class="mul-stat-title">Success</div>
          <div id="mul-stat-success" class="mul-stat-val">0</div>
        </div>
        <div id="mul-chip-failed" class="mul-stat-chip failed">
          <div class="mul-stat-title">Failed</div>
          <div id="mul-stat-failed" class="mul-stat-val">0</div>
        </div>
        <div class="mul-stat-chip">
          <div class="mul-stat-title">Remaining</div>
          <div id="mul-stat-remaining" class="mul-stat-val">0</div>
        </div>
      </div>

      <!-- 4. Status Message -->
      <div id="mul-status-msg">Opening URLs...</div>

      <!-- 5. Dedicated Action Controls Row: Spacious & Clear -->
      <div class="mul-actions-row">
        <button id="mul-btn-pr" class="mul-btn">Pause</button>
        <button id="mul-btn-stop" class="mul-btn stop">Stop</button>
      </div>
    </div>
  `;
  document.documentElement.appendChild(host);

  const card    = host.querySelector('#mul-card')!     as HTMLElement;
  const toggle  = host.querySelector('#mul-toggle')!   as HTMLButtonElement;
  const btnPR   = host.querySelector('#mul-btn-pr')!   as HTMLButtonElement;
  const btnStop = host.querySelector('#mul-btn-stop')! as HTMLButtonElement;

  // Minimize / expand
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    setMin(true);
  });
  card.addEventListener('click', () => {
    if (minimized) setMin(false);
  });

  // Pause / Resume
  btnPR.addEventListener('click', (e) => {
    e.stopPropagation();
    const label = btnPR.textContent?.trim();
    chrome.runtime.sendMessage({ type: label === 'Resume' ? 'RESUME_QUEUE' : 'PAUSE_QUEUE' })
      .catch(() => {});
  });

  // Stop
  btnStop.addEventListener('click', (e) => {
    e.stopPropagation();
    chrome.runtime.sendMessage({ type: 'STOP_QUEUE' }).catch(() => {});
  });

  return host;
}

function setMin(v: boolean): void {
  minimized = v;
  const card = document.getElementById('mul-card');
  if (!card) return;
  if (v) {
    card.classList.add('minimized');
  } else {
    card.classList.remove('minimized');
  }
}

// ─── Update / Remove ──────────────────────────────────────────────────────────

function deriveStats(state: QueueSessionState) {
  let success = 0, failed = 0, opening = 0;
  for (const o of Object.values(state.entryOutcomes ?? {})) {
    if (o === 'opened')  success++;
    else if (o === 'failed')  failed++;
    else if (o === 'opening') opening++;
  }
  const dispatched = success + failed + opening;
  const total = state.entries?.length ?? 0;
  const remaining = Math.max(0, total - dispatched);
  return {
    success,
    failed,
    remaining,
    dispatched,
    total,
    pct: total > 0 ? Math.round((dispatched / total) * 100) : 0,
  };
}

function removeWidget(): void {
  const host = document.getElementById(HOST_ID);
  if (!host) return;
  const card = host.querySelector('#mul-card') as HTMLElement | null;
  if (card) {
    card.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
    card.style.opacity = '0';
    card.style.transform = 'translateY(10px) scale(0.95)';
  }
  setTimeout(() => host.remove(), 220);
}

function updateWidget(state: QueueSessionState): void {
  const isActive = state.status === 'running' || state.status === 'paused';

  if (!isActive) {
    removeWidget();
    return;
  }

  maintainKeepAlive();
  getOrCreate();

  const cfg = STATUS_CFG[state.status as 'running' | 'paused'];
  const stats = deriveStats(state);
  const isRunning = state.status === 'running';

  // 1. Dot
  const dot = document.getElementById('mul-dot');
  if (dot) {
    dot.className = isRunning ? 'running' : '';
    dot.style.background = cfg.dotColor;
  }

  // 2. Pill
  const pill = document.getElementById('mul-pill');
  if (pill) {
    pill.textContent = cfg.label;
    pill.style.background  = cfg.pillBg;
    pill.style.borderColor = cfg.pillBorder;
    pill.style.color       = cfg.pillText;
  }

  // 3. Progress percentage & track fill
  const pct = document.getElementById('mul-pct');
  if (pct) pct.textContent = `${stats.pct}%`;

  const fill = document.getElementById('mul-fill');
  if (fill) fill.style.width = `${Math.min(100, Math.max(0, stats.pct))}%`;

  // 4. Counts
  const dispatchedEl = document.getElementById('mul-dispatched');
  const totalEl      = document.getElementById('mul-total');
  if (dispatchedEl) dispatchedEl.textContent = String(stats.dispatched);
  if (totalEl)      totalEl.textContent      = String(stats.total);

  // 5. Active slots in queue mode
  const activeSlotsEl = document.getElementById('mul-active-slots');
  if (activeSlotsEl) {
    if (state.mode === 'queue') {
      const activeTabs = state.managedTabIds?.length ?? 0;
      activeSlotsEl.textContent = `· ${activeTabs}/${state.limit} active slots`;
      activeSlotsEl.style.display = 'inline';
    } else {
      activeSlotsEl.style.display = 'none';
    }
  }

  // 6. Stats breakdown chips
  const statSuccess = document.getElementById('mul-stat-success');
  const statFailed  = document.getElementById('mul-stat-failed');
  const statRem     = document.getElementById('mul-stat-remaining');
  const chipFailed  = document.getElementById('mul-chip-failed');

  if (statSuccess) statSuccess.textContent = String(stats.success);
  if (statFailed)  statFailed.textContent  = String(stats.failed);
  if (statRem)     statRem.textContent     = String(stats.remaining);

  if (chipFailed) {
    if (stats.failed > 0) {
      chipFailed.classList.add('has-errors');
    } else {
      chipFailed.classList.remove('has-errors');
    }
  }

  // 7. Status Message
  const statusMsgEl = document.getElementById('mul-status-msg');
  if (statusMsgEl) {
    statusMsgEl.textContent = state.statusMessage || 'Opening URLs...';
    statusMsgEl.title = state.statusMessage || '';
  }

  // 8. Minimized info
  const minCounts = document.getElementById('mul-min-counts');
  if (minCounts) {
    minCounts.textContent = `${stats.dispatched}/${stats.total} (${stats.pct}%)`;
  }

  // 9. Pause / Resume button
  const btnPR = document.getElementById('mul-btn-pr') as HTMLButtonElement | null;
  if (btnPR) {
    if (isRunning) {
      btnPR.textContent = 'Pause';
      btnPR.className = 'mul-btn';
    } else {
      btnPR.textContent = 'Resume';
      btnPR.className = 'mul-btn resume';
    }
  }

  // 10. Toggle button
  const tog = document.getElementById('mul-toggle');
  if (tog) tog.innerHTML = '&minus;';
}

// ─── Message listener ─────────────────────────────────────────────────────────

function onMessage(message: unknown): void {
  if (
    typeof message !== 'object' || message === null ||
    (message as ContentMessage).type !== 'MULTIURL_STATE_UPDATE'
  ) return;
  updateWidget((message as ContentMessage).state);
}

// ─── Init ─────────────────────────────────────────────────────────────────────

function init(): void {
  if (typeof chrome === 'undefined' || !chrome.runtime?.onMessage) return;

  chrome.runtime.onMessage.addListener(onMessage);

  // Query current state immediately upon script load
  chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response) => {
    if (chrome.runtime.lastError || !response?.success || !response?.data) return;
    updateWidget(response.data as QueueSessionState);
  });
}

init();
