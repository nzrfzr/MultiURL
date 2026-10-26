import { ExtensionMessage, ExtensionResponse } from '../shared/messages';

// Check if running in browser extension runtime
export function hasExtensionApi(): boolean {
  return (
    typeof chrome !== 'undefined' &&
    !!chrome.runtime &&
    typeof chrome.runtime.sendMessage === 'function'
  );
}

/**
 * Creates a browser tab with the given URL.
 * Does not activate the tab by default so the user is not disrupted.
 */
export async function createTab(url: string, active = false): Promise<number> {
  if (!hasExtensionApi() || !chrome.tabs?.create) {
    // Mock / fallback for local development or preview
    console.log('[Dev Mock] Created tab for URL:', url);
    return Math.floor(Math.random() * 100000) + 1;
  }

  // Modern Chrome MV3 & Vitest mock support Promise when callback is omitted
  try {
    const maybePromise = chrome.tabs.create({ url, active });
    if (maybePromise && typeof (maybePromise as any).then === 'function') {
      const tab = await maybePromise;
      if (!tab || tab.id === undefined) {
        throw new Error('Failed to create tab: no tab ID returned by browser');
      }
      return tab.id;
    }
  } catch (err: any) {
    if (err && err.message?.includes('tab ID')) {
      throw err;
    }
  }

  // Legacy callback fallback
  return new Promise<number>((resolve, reject) => {
    try {
      chrome.tabs.create({ url, active }, (tab) => {
        const err = chrome.runtime?.lastError;
        if (err) {
          reject(new Error(err.message || 'Failed to create tab'));
        } else if (!tab || tab.id === undefined) {
          reject(new Error('Failed to create tab: no tab ID returned by browser'));
        } else {
          resolve(tab.id);
        }
      });
    } catch (e: any) {
      reject(new Error(e?.message || 'Failed to call chrome.tabs.create'));
    }
  });
}

/**
 * Checks whether a given tab ID is still open in the browser.
 */
export async function isTabAlive(tabId: number): Promise<boolean> {
  if (!hasExtensionApi() || !chrome.tabs) return false;

  try {
    const maybePromise = chrome.tabs.get(tabId);
    if (maybePromise && typeof (maybePromise as any).then === 'function') {
      const tab = await maybePromise;
      return !!tab && tab.id === tabId;
    }
  } catch {
    return false;
  }

  return new Promise<boolean>((resolve) => {
    try {
      chrome.tabs.get(tabId, (tab) => {
        if (chrome.runtime?.lastError || !tab) {
          resolve(false);
        } else {
          resolve(tab.id === tabId);
        }
      });
    } catch {
      resolve(false);
    }
  });
}

/**
 * Registers a listener for tab close events.
 */
export function onTabRemoved(callback: (tabId: number) => void): () => void {
  if (!hasExtensionApi() || !chrome.tabs?.onRemoved) return () => {};

  const listener = (removedId: number) => {
    callback(removedId);
  };
  chrome.tabs.onRemoved.addListener(listener);
  return () => {
    chrome.tabs.onRemoved.removeListener(listener);
  };
}

/**
 * Registers a listener for tab status updates (e.g. status === 'complete').
 */
export function onTabUpdated(
  callback: (tabId: number, status?: string) => void
): () => void {
  if (!hasExtensionApi() || !chrome.tabs?.onUpdated) return () => {};

  const listener = (updatedId: number, changeInfo: { status?: string; [key: string]: any }) => {
    if (changeInfo.status) {
      callback(updatedId, changeInfo.status);
    }
  };
  chrome.tabs.onUpdated.addListener(listener);
  return () => {
    chrome.tabs.onUpdated.removeListener(listener);
  };
}

/**
 * Registers a listener for tab replacement events (e.g. process swap / prerender).
 */
export function onTabReplaced(
  callback: (addedTabId: number, removedTabId: number) => void
): () => void {
  if (!hasExtensionApi() || !chrome.tabs?.onReplaced) return () => {};

  const listener = (addedTabId: number, removedTabId: number) => {
    callback(addedTabId, removedTabId);
  };
  chrome.tabs.onReplaced.addListener(listener);
  return () => {
    chrome.tabs.onReplaced.removeListener(listener);
  };
}

/**
 * Sends a message from popup to background service worker.
 */
export async function sendRuntimeMessage<T = unknown>(
  message: ExtensionMessage
): Promise<ExtensionResponse<T>> {
  if (!hasExtensionApi()) {
    console.warn('[Dev Mock] runtime.sendMessage called in non-extension environment', message);
    return { success: false, error: 'Extension API not available in standalone preview' };
  }

  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response: ExtensionResponse<T>) => {
      const err = chrome.runtime.lastError;
      if (err) {
        resolve({ success: false, error: err.message });
      } else {
        resolve(response || { success: true });
      }
    });
  });
}

/**
 * Storage helpers using chrome.storage.local.
 */
export async function readStorage<T>(key: string): Promise<T | null> {
  if (!hasExtensionApi() || !chrome.storage?.local) {
    try {
      const val = localStorage.getItem(`multiurls_${key}`);
      return val ? JSON.parse(val) : null;
    } catch {
      return null;
    }
  }

  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result: Record<string, any>) => {
      resolve((result[key] as T) ?? null);
    });
  });
}

export async function writeStorage<T>(key: string, value: T): Promise<void> {
  if (!hasExtensionApi() || !chrome.storage?.local) {
    try {
      localStorage.setItem(`multiurls_${key}`, JSON.stringify(value));
    } catch {
      // ignore in dev
    }
    return;
  }

  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, () => resolve());
  });
}
