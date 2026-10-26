import { describe, it, expect } from 'vitest';
import { parseUrls, calculateStats } from '../../src/core/url-parser';

describe('url-parser', () => {
  it('parses multiline input and flags duplicates accurately', () => {
    const raw = `
      https://example.com
      https://example.com/
      http://test.org
      javascript:void(0)
      google.com
    `;

    const entries = parseUrls(raw);
    expect(entries.length).toBe(5);

    // example.com and example.com/ should be duplicates of each other
    expect(entries[0].isValid).toBe(true);
    expect(entries[0].isDuplicate).toBe(false);

    expect(entries[1].isValid).toBe(true);
    expect(entries[1].isDuplicate).toBe(true); // Duplicate detected!

    expect(entries[2].isValid).toBe(true);
    expect(entries[2].isDuplicate).toBe(false);

    expect(entries[3].isValid).toBe(false); // javascript: is invalid scheme

    expect(entries[4].isValid).toBe(true); // google.com -> https://google.com
    expect(entries[4].isDuplicate).toBe(false);
  });

  it('calculates statistics correctly', () => {
    const raw = `
      https://a.com
      https://b.com
      https://a.com
      invalid_url
    `;
    const entries = parseUrls(raw);
    const stats = calculateStats(entries);

    expect(stats.total).toBe(4);
    expect(stats.valid).toBe(3);
    expect(stats.duplicates).toBe(1);
    expect(stats.invalid).toBe(1);
  });
});
