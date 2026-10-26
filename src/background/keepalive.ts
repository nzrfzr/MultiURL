/**
 * MultiURL — Background Keepalive Manager
 *
 * Keeps Chrome MV3 service worker active in the background while queue tasks
 * are running, without injecting any intrusive UI or popups into web pages.
 */

let isKeepAliveActive = false;

export async function startKeepAlive(): Promise<void> {
  if (isKeepAliveActive) return;
  if (typeof chrome === 'undefined' || !chrome.offscreen?.createDocument) {
    return;
  }

  try {
    if (chrome.offscreen.hasDocument && (await chrome.offscreen.hasDocument())) {
      isKeepAliveActive = true;
      return;
    }

    const reason = (chrome.offscreen.Reason?.BLOBS ?? 'BLOBS') as any;
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: [reason],
      justification: 'Keep queue processing active in background without popup open',
    });
    isKeepAliveActive = true;
    console.log('[MultiURL] Offscreen keepalive document active');
  } catch (err: unknown) {
    // If document already exists or another reason, log notice and maintain flag
    console.warn('[MultiURL] Offscreen keepalive notice:', err);
    isKeepAliveActive = true;
  }
}

export async function stopKeepAlive(): Promise<void> {
  isKeepAliveActive = false;
  if (typeof chrome === 'undefined' || !chrome.offscreen?.closeDocument) {
    return;
  }

  try {
    if (chrome.offscreen.hasDocument && (await chrome.offscreen.hasDocument())) {
      await chrome.offscreen.closeDocument();
      console.log('[MultiURL] Offscreen keepalive document closed');
    }
  } catch (err: unknown) {
    console.warn('[MultiURL] Error closing offscreen keepalive:', err);
  }
}
