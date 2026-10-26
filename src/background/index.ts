import { QueueController } from './queue-controller';
import { ExtensionMessage, ExtensionResponse } from '../shared/messages';

console.log('[MultiURL] Background service worker initialized.');

const controller = new QueueController();

// --- Chrome Alarms: wake service worker for interval/watchdog ticks ---
if (typeof chrome !== 'undefined' && chrome.alarms?.onAlarm) {
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'multiurls_tick') {
      controller.handleAlarmTick();
    } else if (alarm.name === 'multiurls_watchdog') {
      controller.checkAndReconcileQueue().catch((err) =>
        console.warn('[MultiURL] Watchdog alarm error:', err)
      );
    }
  });
}

let monitorWindowId: number | null = null;

async function openMonitorWindow(): Promise<void> {
  if (typeof chrome === 'undefined' || !chrome.windows?.create) return;

  if (monitorWindowId !== null) {
    try {
      const win = await chrome.windows.get(monitorWindowId);
      if (win && win.id) {
        chrome.windows.update(win.id, { focused: false });
        return;
      }
    } catch {
      monitorWindowId = null;
    }
  }

  const url = chrome.runtime.getURL('popup.html?view=monitor');
  try {
    const win = await chrome.windows.create({
      url,
      type: 'popup',
      width: 440,
      height: 300,
      focused: false,
    });
    if (win && win.id !== undefined) {
      monitorWindowId = win.id;
    }
  } catch (err) {
    console.warn('[MultiURL] Could not create monitor window:', err);
  }
}

// Track when monitor window is closed
if (typeof chrome !== 'undefined' && chrome.windows?.onRemoved) {
  chrome.windows.onRemoved.addListener((winId) => {
    if (winId === monitorWindowId) {
      monitorWindowId = null;
    }
  });
}

// ─── Helper: broadcast state to all open tabs ─────────────────────────────────

function broadcastToAllTabs(state: ReturnType<typeof controller.getState>): void {
  if (typeof chrome === 'undefined' || !chrome.tabs?.query) return;
  chrome.tabs.query({}, (tabs) => {
    if (!tabs || tabs.length === 0) return;
    for (const tab of tabs) {
      if (tab.id && tab.id > 0) {
        chrome.tabs.sendMessage(
          tab.id,
          { type: 'MULTIURL_STATE_UPDATE', state },
          () => { void chrome.runtime.lastError; } // ignore "no receiver" errors
        );
      }
    }
  });
}

// ─── When the user switches tabs, forward current state to the new active tab ─

if (typeof chrome !== 'undefined' && chrome.tabs?.onActivated) {
  chrome.tabs.onActivated.addListener(async (activeInfo) => {
    await controller.whenReady();
    const state = controller.getState();
    if (activeInfo.tabId && activeInfo.tabId > 0) {
      chrome.tabs.sendMessage(
        activeInfo.tabId,
        { type: 'MULTIURL_STATE_UPDATE', state },
        () => { void chrome.runtime.lastError; }
      );
    }
  });
}

// ─── Broadcast state updates ──────────────────────────────────────────────────

controller.subscribe((state) => {
  // 1. Notify the popup and monitor window (if open)
  if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
    try {
      const p = chrome.runtime.sendMessage({ type: 'STATE_UPDATED', state });
      if (p && typeof (p as any).catch === 'function') {
        (p as any).catch(() => { /* safe to ignore */ });
      }
    } catch {
      // Safe to ignore
    }
  }

  // 2. Broadcast to all open tabs so in-page widgets remain updated
  broadcastToAllTabs(state);
});

// ─── Message handler ──────────────────────────────────────────────────────────

async function handleMessage(
  message: ExtensionMessage
): Promise<ExtensionResponse> {
  await controller.whenReady();

  switch (message.type) {
    case 'GET_STATE':
      return { success: true, data: controller.getState() };

    case 'START_QUEUE':
      await controller.start(
        message.mode,
        message.entries,
        message.delaySeconds,
        message.limit
      );
      // Automatically open the floating monitor window across the browser!
      openMonitorWindow().catch((err) =>
        console.warn('[MultiURL] openMonitorWindow error:', err)
      );
      return { success: true, data: controller.getState() };

    case 'PAUSE_QUEUE':
      controller.pause();
      return { success: true, data: controller.getState() };

    case 'RESUME_QUEUE':
      controller.resume();
      return { success: true, data: controller.getState() };

    case 'STOP_QUEUE':
      controller.stop();
      return { success: true, data: controller.getState() };

    case 'UPDATE_LIMIT':
      controller.updateLimit(message.limit);
      return { success: true, data: controller.getState() };

    default:
      return { success: false, error: 'Unknown message type' };
  }
}

// Listen for commands from popup / content scripts
if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener(
    (
      message: ExtensionMessage,
      _sender: chrome.runtime.MessageSender,
      sendResponse: (response: ExtensionResponse) => void
    ) => {
      handleMessage(message)
        .then(sendResponse)
        .catch((err) => {
          console.error('[MultiURL] handleMessage error:', err);
          sendResponse({ success: false, error: String(err) });
        });
      return true; // keep channel open for async response
    }
  );
}
