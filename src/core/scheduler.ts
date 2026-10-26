import { QueueProgress, QueueSessionState } from './types';

export const DEFAULT_LIMIT = 10;
export const MIN_LIMIT = 1;
export const MAX_LIMIT = 100;

export const DEFAULT_INTERVAL_SECONDS = 2;
export const MIN_INTERVAL_SECONDS = 0.5;
export const MAX_INTERVAL_SECONDS = 300;

/**
 * Calculates how many slots are open in Queue Mode.
 * Formula: max(0, limit - activeManagedTabs)
 */
export function calculateAvailableSlots(limit: number, activeManagedTabs: number): number {
  return Math.max(0, limit - Math.max(0, activeManagedTabs));
}

/**
 * Calculates how many URLs can be dispatched in the next batch.
 * Formula: min(max(0, limit - activeManagedTabs), queueRemaining)
 */
export function calculateRefillCount(
  limit: number,
  activeManagedTabs: number,
  queueRemaining: number
): number {
  const availableSlots = calculateAvailableSlots(limit, activeManagedTabs);
  return Math.min(availableSlots, Math.max(0, queueRemaining));
}

/**
 * Validates the interval seconds input.
 */
export function validateInterval(input: number): { isValid: boolean; value: number; error?: string } {
  if (isNaN(input) || input < MIN_INTERVAL_SECONDS) {
    return {
      isValid: false,
      value: DEFAULT_INTERVAL_SECONDS,
      error: `Interval must be at least ${MIN_INTERVAL_SECONDS} seconds`,
    };
  }
  if (input > MAX_INTERVAL_SECONDS) {
    return {
      isValid: false,
      value: MAX_INTERVAL_SECONDS,
      error: `Interval cannot exceed ${MAX_INTERVAL_SECONDS} seconds`,
    };
  }
  return { isValid: true, value: input };
}

/**
 * Validates the Queue Mode tab limit.
 */
export function validateLimit(input: number): { isValid: boolean; value: number; error?: string } {
  const rounded = Math.floor(input);
  if (isNaN(rounded) || rounded < MIN_LIMIT) {
    return {
      isValid: false,
      value: DEFAULT_LIMIT,
      error: `Limit must be at least ${MIN_LIMIT}`,
    };
  }
  if (rounded > MAX_LIMIT) {
    return {
      isValid: false,
      value: MAX_LIMIT,
      error: `Limit cannot exceed ${MAX_LIMIT}`,
    };
  }
  return { isValid: true, value: rounded };
}

/**
 * Computes progress summary from session state.
 */
export function deriveProgress(state: QueueSessionState): QueueProgress {
  const totalSelected = state.entries.length;
  let success = 0;
  let failed = 0;

  for (const outcome of Object.values(state.entryOutcomes)) {
    if (outcome === 'opened') success++;
    if (outcome === 'failed') failed++;
  }

  const dispatched = success + failed;
  const remaining = Math.max(0, totalSelected - dispatched);

  return {
    totalSelected,
    dispatched,
    success,
    failed,
    remaining,
    liveManagedTabs: state.managedTabIds.length,
  };
}
