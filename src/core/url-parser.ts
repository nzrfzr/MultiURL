import { UrlEntry, UrlStats } from './types';
import { normalizeAndValidateUrl } from './url-validator';

/**
 * Splits raw multiline text into candidate URL strings.
 * Handles \r\n, \n, commas, semicolons, and tab separators.
 */
export function splitRawInput(rawText: string): string[] {
  if (!rawText || !rawText.trim()) {
    return [];
  }

  // Split lines first
  const lines = rawText.split(/\r?\n/);
  const candidates: string[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Check if line contains space-separated or comma/semicolon separated URLs
    // Only split on comma/semicolon/space if it matches multiple distinct domains/schemes
    // to avoid breaking URLs with query strings like ?tags=a,b;c
    if (/[\s,;]+(?:https?:\/\/|www\.)/i.test(trimmedLine)) {
      const parts = trimmedLine.split(/[\t]+|(?:\s*[,;]+\s*)|(?:\s+(?=https?:\/\/|www\.))/);
      for (const part of parts) {
        const p = part.trim();
        if (p) candidates.push(p);
      }
    } else {
      candidates.push(trimmedLine);
    }
  }

  return candidates;
}

function hashUrlString(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

/**
 * Parses raw input into a list of UrlEntry objects, detecting duplicates and calculating validity.
 */
export function parseUrls(rawText: string): UrlEntry[] {
  const candidates = splitRawInput(rawText);
  const seenValidUrls = new Set<string>();
  const entries: UrlEntry[] = [];

  candidates.forEach((raw, index) => {
    const { isValid, normalizedUrl, error } = normalizeAndValidateUrl(raw);

    let isDuplicate = false;
    if (isValid && normalizedUrl) {
      if (seenValidUrls.has(normalizedUrl)) {
        isDuplicate = true;
      } else {
        seenValidUrls.add(normalizedUrl);
      }
    }

    entries.push({
      id: `url_${index + 1}_${hashUrlString(raw)}`,
      raw,
      normalizedUrl: isValid ? normalizedUrl : raw,
      isValid,
      isDuplicate,
      // Valid non-duplicates are selected by default for best user experience
      isSelected: isValid && !isDuplicate,
      errorReason: error,
    });
  });

  return entries;
}

/**
 * Calculates statistics for Total, Valid, Duplicates, and Invalid items.
 */
export function calculateStats(entries: UrlEntry[]): UrlStats {
  let valid = 0;
  let duplicates = 0;
  let invalid = 0;

  for (const entry of entries) {
    if (entry.isValid) {
      valid++;
    } else {
      invalid++;
    }

    if (entry.isDuplicate) {
      duplicates++;
    }
  }

  return {
    total: entries.length,
    valid,
    duplicates,
    invalid,
  };
}
