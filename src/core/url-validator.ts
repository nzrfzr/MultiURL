export interface ValidationResult {
  isValid: boolean;
  normalizedUrl: string;
  error?: string;
}

const DISALLOWED_SCHEMES = [
  'javascript:',
  'data:',
  'file:',
  'vbscript:',
  'about:',
  'chrome:',
  'chrome-extension:',
  'moz-extension:',
  'blob:',
];

/**
 * Normalizes and validates a candidate URL string according to project safety rules.
 * Accepts http, https, www.*, and bare domains.
 * Rejects javascript:, data:, file:, and malformed targets.
 */
export function normalizeAndValidateUrl(rawInput: string): ValidationResult {
  let trimmed = rawInput.trim();

  // Strip wrapping quotes if user pasted e.g. "https://example.com" or 'https://example.com'
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    trimmed = trimmed.slice(1, -1).trim();
  }

  if (!trimmed) {
    return {
      isValid: false,
      normalizedUrl: '',
      error: 'Empty URL input',
    };
  }

  // Check for disallowed dangerous schemes early
  const lowerTrimmed = trimmed.toLowerCase();
  for (const scheme of DISALLOWED_SCHEMES) {
    if (lowerTrimmed.startsWith(scheme)) {
      return {
        isValid: false,
        normalizedUrl: trimmed,
        error: `Disallowed protocol scheme '${scheme}'`,
      };
    }
  }

  // Prepend https:// if no scheme is provided or if starts with www. or bare domain
  let candidate = trimmed;
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(candidate)) {
    // If it has a colon followed by something that isn't a port (e.g. malformed scheme), reject
    if (candidate.includes(':') && !/^[^:/]+:\d+/.test(candidate)) {
      return {
        isValid: false,
        normalizedUrl: candidate,
        error: 'Unsupported or malformed URL scheme',
      };
    }
    candidate = `https://${candidate}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return {
      isValid: false,
      normalizedUrl: trimmed,
      error: 'Malformed URL format',
    };
  }

  // Only allow http: and https: protocols
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return {
      isValid: false,
      normalizedUrl: trimmed,
      error: `Protocol '${parsed.protocol}' is not supported. Only http and https are allowed.`,
    };
  }

  // Validate hostname
  const hostname = parsed.hostname;
  if (!hostname || hostname.includes(' ') || hostname.startsWith('.') || hostname.endsWith('.')) {
    return {
      isValid: false,
      normalizedUrl: trimmed,
      error: 'Invalid hostname',
    };
  }

  // Basic check: must contain a dot or be localhost or valid IPv4/IPv6
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
  const hasDot = hostname.includes('.');
  if (!isLocalhost && !hasDot) {
    return {
      isValid: false,
      normalizedUrl: trimmed,
      error: 'Hostname must contain a valid domain or be localhost',
    };
  }

  // Normalization:
  // - Hostname is already lowercased by URL constructor.
  // - If pathname is just "/", remove trailing slash for consistent duplicate comparison (e.g. https://google.com/ -> https://google.com)
  let normalized = parsed.toString();
  if (parsed.pathname === '/' && !parsed.search && !parsed.hash) {
    normalized = normalized.slice(0, -1);
  }

  return {
    isValid: true,
    normalizedUrl: normalized,
  };
}
