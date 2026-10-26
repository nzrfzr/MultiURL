import { describe, it, expect, beforeEach, vi } from 'vitest';
import { updateBadge } from '../../src/platform/browser-api';

describe('browser-api updateBadge', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('updates badge text and color when chrome.action is available', () => {
    const setBadgeTextMock = vi.fn();
    const setBadgeBackgroundColorMock = vi.fn();

    (globalThis as any).chrome = {
      runtime: { sendMessage: vi.fn() },
      action: {
        setBadgeText: setBadgeTextMock,
        setBadgeBackgroundColor: setBadgeBackgroundColorMock,
      },
    };

    updateBadge('5', '#2563EB');
    expect(setBadgeTextMock).toHaveBeenCalledWith({ text: '5' });
    expect(setBadgeBackgroundColorMock).toHaveBeenCalledWith({ color: '#2563EB' });
  });

  it('safely handles non-extension or missing action API', () => {
    (globalThis as any).chrome = undefined;
    expect(() => updateBadge('5', '#2563EB')).not.toThrow();
  });
});
