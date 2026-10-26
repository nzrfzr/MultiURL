import { QueueSessionState } from '../core/types';
import { readStorage, writeStorage } from '../platform/browser-api';

const STORAGE_KEY = 'multiurls_queue_session_v1';

let writeChain: Promise<void> = Promise.resolve();

export function saveSessionState(state: QueueSessionState): Promise<void> {
  // Snapshot current state so later mutations during async write do not corrupt data
  const snapshot = JSON.parse(JSON.stringify(state));
  writeChain = writeChain.then(async () => {
    try {
      await writeStorage(STORAGE_KEY, snapshot);
    } catch (err) {
      console.warn('[MultiURL] Failed to save session state:', err);
    }
  });
  return writeChain;
}

export async function loadSessionState(): Promise<QueueSessionState | null> {
  return await readStorage<QueueSessionState>(STORAGE_KEY);
}

export function clearSessionState(): Promise<void> {
  writeChain = writeChain.then(async () => {
    try {
      await writeStorage(STORAGE_KEY, null);
    } catch (err) {
      console.warn('[MultiURL] Failed to clear session state:', err);
    }
  });
  return writeChain;
}
