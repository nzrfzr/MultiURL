// MultiURL — Keepalive Background Heartbeat
// Maintains a persistent port connection to keep the Chrome MV3 service worker
// active in the background while queue tasks are running.

let port = null;

function connectToBackground() {
  if (typeof chrome === 'undefined' || !chrome.runtime?.connect) return;
  try {
    port = chrome.runtime.connect({ name: 'multiurl_keepalive' });
    port.onDisconnect.addListener(() => {
      port = null;
      // Reconnect after brief pause if still needed
      setTimeout(connectToBackground, 1000);
    });
  } catch (err) {
    console.warn('[MultiURL Keepalive] Connect error:', err);
  }
}

connectToBackground();

// Send heartbeat ping every 20 seconds (Chrome service worker idle timeout is 30s)
setInterval(() => {
  if (port) {
    try {
      port.postMessage({ type: 'KEEPALIVE_HEARTBEAT', time: Date.now() });
    } catch {
      port = null;
      connectToBackground();
    }
  } else {
    connectToBackground();
  }
}, 20000);
