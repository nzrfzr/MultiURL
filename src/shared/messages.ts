import { OpenMode, QueueSessionState, UrlEntry } from '../core/types';

export type ExtensionMessage =
  | {
      type: 'START_QUEUE';
      mode: OpenMode;
      entries: UrlEntry[];
      delaySeconds: number;
      limit: number;
    }
  | {
      type: 'PAUSE_QUEUE';
    }
  | {
      type: 'RESUME_QUEUE';
    }
  | {
      type: 'STOP_QUEUE';
    }
  | {
      type: 'UPDATE_LIMIT';
      limit: number;
    }
  | {
      type: 'GET_STATE';
    }
  | {
      type: 'STATE_UPDATED';
      state: QueueSessionState;
    };

export interface ExtensionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
