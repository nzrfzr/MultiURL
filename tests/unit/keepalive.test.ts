import { describe, it, expect, beforeEach, vi } from 'vitest';
import { startKeepAlive, stopKeepAlive } from '../../src/background/keepalive';

describe('Keepalive Manager', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('creates offscreen document if not present', async () => {
    let hasDoc = false;
    const createDocMock = vi.fn(async () => {
      hasDoc = true;
    });

    (globalThis as any).chrome = {
      offscreen: {
        hasDocument: vi.fn(async () => hasDoc),
        createDocument: createDocMock,
        closeDocument: vi.fn(async () => {
          hasDoc = false;
        }),
        Reason: { BLOBS: 'BLOBS' },
      },
    };

    await startKeepAlive();
    expect(createDocMock).toHaveBeenCalledTimes(1);
    expect(createDocMock).toHaveBeenCalledWith({
      url: 'offscreen.html',
      reasons: ['BLOBS'],
      justification: expect.any(String),
    });
  });

  it('closes offscreen document when stopped', async () => {
    let hasDoc = true;
    const closeDocMock = vi.fn(async () => {
      hasDoc = false;
    });

    (globalThis as any).chrome = {
      offscreen: {
        hasDocument: vi.fn(async () => hasDoc),
        createDocument: vi.fn(),
        closeDocument: closeDocMock,
        Reason: { BLOBS: 'BLOBS' },
      },
    };

    await stopKeepAlive();
    expect(closeDocMock).toHaveBeenCalledTimes(1);
  });

  it('safely handles environments without offscreen API', async () => {
    (globalThis as any).chrome = undefined;
    await expect(startKeepAlive()).resolves.not.toThrow();
    await expect(stopKeepAlive()).resolves.not.toThrow();
  });
});
