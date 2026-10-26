import { describe, it, expect } from 'vitest';
import { normalizeAndValidateUrl } from '../../src/core/url-validator';

describe('normalizeAndValidateUrl', () => {
  it('normalizes standard https and http URLs', () => {
    const res1 = normalizeAndValidateUrl('https://example.com/test');
    expect(res1.isValid).toBe(true);
    expect(res1.normalizedUrl).toBe('https://example.com/test');

    const res2 = normalizeAndValidateUrl('http://sub.domain.org/path?query=1#hash');
    expect(res2.isValid).toBe(true);
    expect(res2.normalizedUrl).toBe('http://sub.domain.org/path?query=1#hash');
  });

  it('normalizes bare domains and www. by prepending https://', () => {
    const res1 = normalizeAndValidateUrl('example.com');
    expect(res1.isValid).toBe(true);
    expect(res1.normalizedUrl).toBe('https://example.com');

    const res2 = normalizeAndValidateUrl('www.google.com/search?q=test');
    expect(res2.isValid).toBe(true);
    expect(res2.normalizedUrl).toBe('https://www.google.com/search?q=test');
  });

  it('normalizes root trailing slash consistently', () => {
    const withSlash = normalizeAndValidateUrl('https://example.com/');
    const withoutSlash = normalizeAndValidateUrl('https://example.com');
    expect(withSlash.normalizedUrl).toBe(withoutSlash.normalizedUrl);
  });

  it('rejects dangerous and disallowed schemes', () => {
    expect(normalizeAndValidateUrl('javascript:alert(1)').isValid).toBe(false);
    expect(normalizeAndValidateUrl('data:text/html,<script>alert(1)</script>').isValid).toBe(false);
    expect(normalizeAndValidateUrl('file:///C:/Windows/system32').isValid).toBe(false);
    expect(normalizeAndValidateUrl('vbscript:msgbox("hi")').isValid).toBe(false);
  });

  it('handles quotes around URLs cleanly', () => {
    const res = normalizeAndValidateUrl('"https://example.com/quoted"');
    expect(res.isValid).toBe(true);
    expect(res.normalizedUrl).toBe('https://example.com/quoted');
  });

  it('rejects empty or whitespace-only strings', () => {
    expect(normalizeAndValidateUrl('').isValid).toBe(false);
    expect(normalizeAndValidateUrl('    ').isValid).toBe(false);
  });

  it('rejects invalid hosts without domain or localhost', () => {
    expect(normalizeAndValidateUrl('not-a-valid-domain').isValid).toBe(false);
  });
});
