export type OpenMode = 'open_all' | 'interval' | 'after_load' | 'queue';

export type QueueStatus =
  | 'idle'
  | 'running'
  | 'paused'
  | 'stopped'
  | 'completed'
  | 'failed';

export type UrlOutcome = 'queued' | 'opening' | 'opened' | 'failed';

export interface UrlEntry {
  id: string;
  raw: string;
  normalizedUrl: string;
  isValid: boolean;
  isDuplicate: boolean;
  isSelected: boolean;
  errorReason?: string;
}

export interface UrlStats {
  total: number;
  valid: number;
  duplicates: number;
  invalid: number;
}

export interface QueueProgress {
  totalSelected: number;
  dispatched: number;
  success: number;
  failed: number;
  remaining: number;
  liveManagedTabs: number;
}

export interface QueueSessionState {
  sessionId: string;
  status: QueueStatus;
  mode: OpenMode;
  delaySeconds: number;
  limit: number;
  entries: UrlEntry[];
  nextIndex: number;
  managedTabIds: number[];
  tabToEntryIdMap: Record<number, string>;
  entryOutcomes: Record<string, UrlOutcome>;
  statusMessage: string;
  lastError?: string;
  startedAt?: number;
  updatedAt: number;
}
