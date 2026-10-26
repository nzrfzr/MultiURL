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

// ─── Keepalive Port Listener ──────────────────────────────────────────────────
if (typeof chrome !== 'undefined' && chrome.runtime?.onConnect) {
  chrome.runtime.onConnect.addListener((port) => {
    if (port.name === 'multiurl_keepalive') {
      port.onDisconnect.addListener(() => {});
    }
  });
}
// ─── Broadcast state updates to popup ────────────────────────────────────────

controller.subscribe((state) => {
  if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
    try {
      const p = chrome.runtime.sendMessage({ type: 'STATE_UPDATED', state });
      if (p && typeof (p as any).catch === 'function') {
        (p as any).catch(() => { /* safe to ignore — popup may be closed */ });
      }
    } catch {
      // Safe to ignore
    }
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
