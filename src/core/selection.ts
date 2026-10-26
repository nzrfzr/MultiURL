import { UrlEntry } from './types';

/**
 * Selects all valid entries in the list.
 */
export function selectAll(entries: UrlEntry[]): UrlEntry[] {
  return entries.map((e) => ({
    ...e,
    isSelected: e.isValid,
  }));
}

/**
 * Deselects all entries.
 */
export function selectNone(entries: UrlEntry[]): UrlEntry[] {
  return entries.map((e) => ({
    ...e,
    isSelected: false,
  }));
}

/**
 * Toggles selection of a specific entry by ID.
 */
export function toggleSelection(entries: UrlEntry[], id: string): UrlEntry[] {
  return entries.map((e) => (e.id === id ? { ...e, isSelected: !e.isSelected } : e));
}

/**
 * Deletes all currently selected entries.
 */
export function deleteSelected(entries: UrlEntry[]): UrlEntry[] {
  return entries.filter((e) => !e.isSelected);
}

/**
 * Removes a single entry by ID.
 */
export function removeEntry(entries: UrlEntry[], id: string): UrlEntry[] {
  return entries.filter((e) => e.id !== id);
}

/**
 * Filters the list to valid and selected entries ready for dispatch.
 */
export function getEligibleSelectedEntries(entries: UrlEntry[]): UrlEntry[] {
  return entries.filter((e) => e.isSelected && e.isValid);
}
