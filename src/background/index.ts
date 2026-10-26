import { QueueController } from './queue-controller';
import { ExtensionMessage, ExtensionResponse } from '../shared/messages';
import { startKeepAlive, stopKeepAlive } from './keepalive';
import { updateBadge } from '../platform/browser-api';

console.log('[MultiURL] Background service worker initialized.');

const controller = new QueueController();

// ─── Chrome Alarms: wake service worker for interval/watchdog ticks ───
if (typeof chrome !== 'undefined' && chrome.alarms?.onAlarm) {
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'multiurls_tick') {
      controller.handleAlarmTick().catch((err) =>
        console.warn('[MultiURL] Alarm tick error:', err)
      );
    } else if (alarm.name === 'multiurls_watchdog') {
      controller.checkAndReconcileQueue().catch((err) =>
        console.warn('[MultiURL] Watchdog alarm error:', err)
      );
    }
  });
}

// ─── Keepalive Port Listener ──────────────────────────────────────────────────
let activeKeepAlivePort: chrome.runtime.Port | null = null;

if (typeof chrome !== 'undefined' && chrome.runtime?.onConnect) {
  chrome.runtime.onConnect.addListener((port) => {
    if (port.name === 'multiurl_keepalive') {
      activeKeepAlivePort = port;
      port.onMessage.addListener((_msg) => {
        // Heartbeat received from offscreen document resets Chrome SW idle timer
      });
      port.onDisconnect.addListener(() => {
        if (activeKeepAlivePort === port) {
          activeKeepAlivePort = null;
        }
      });
    }
  });
}

// ─── On Startup: restore session if browser restarted while running ───────────
if (typeof chrome !== 'undefined' && chrome.runtime?.onStartup) {
  chrome.runtime.onStartup.addListener(async () => {
    await controller.whenReady();
    if (controller.getState().status === 'running') {
      startKeepAlive().catch(() => {});
    }
  });
}

// ─── Badge and Keepalive Sync based on controller state ───────────────────────
let badgeClearTimer: NodeJS.Timeout | null = null;

controller.subscribe((state) => {
  // 1. Notify the popup UI (if open)
  if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
    try {
      const p = chrome.runtime.sendMessage({ type: 'STATE_UPDATED', state });
      if (p && typeof (p as any).catch === 'function') {
        (p as any).catch(() => {
          /* safe to ignore — popup may be closed */
        });
      }
    } catch {
      // Safe to ignore
    }
  }

  // 2. Manage background keepalive
  if (state.status === 'running') {
    startKeepAlive().catch(() => {});
  } else if (
    state.status === 'completed' ||
    state.status === 'stopped' ||
    state.status === 'idle'
  ) {
    stopKeepAlive().catch(() => {});
  }

  // 3. Update extension toolbar icon badge for seamless background status
  if (badgeClearTimer) {
    clearTimeout(badgeClearTimer);
    badgeClearTimer = null;
  }

  if (state.status === 'running') {
    const remaining = state.entries.length - state.nextIndex;
    const badgeText =
      remaining > 0
        ? String(remaining)
        : state.managedTabIds.length > 0
        ? String(state.managedTabIds.length)
        : '▶';
    updateBadge(badgeText, '#2563EB');
  } else if (state.status === 'paused') {
    updateBadge('II', '#D97706');
  } else if (state.status === 'completed') {
    updateBadge('✓', '#059669');
    // Clear completed badge after 8 seconds
    badgeClearTimer = setTimeout(() => {
      badgeClearTimer = null;
      if (controller.getState().status === 'completed') {
        updateBadge('', '');
      }
    }, 8000);
  } else {
    updateBadge('', '');
  }
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

// Listen for commands from popup
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
