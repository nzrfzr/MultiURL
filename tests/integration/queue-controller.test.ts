import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QueueController } from '../../src/background/queue-controller';
import { UrlEntry } from '../../src/core/types';

// Mock chrome APIs for integration testing
let currentTabId = 100;
let liveTabs = new Set<number>();
let tabRemovedListeners: ((tabId: number) => void)[] = [];
let tabUpdatedListeners: ((tabId: number, changeInfo: { status?: string }) => void)[] = [];
let tabReplacedListeners: ((addedTabId: number, removedTabId: number) => void)[] = [];

beforeEach(() => {
  currentTabId = 100;
  liveTabs = new Set();
  tabRemovedListeners = [];
  tabUpdatedListeners = [];
  tabReplacedListeners = [];

  // Setup chrome mock on globalThis
  (globalThis as any).chrome = {
    runtime: {
      sendMessage: vi.fn(),
      onMessage: { addListener: vi.fn(), removeListener: vi.fn() },
    },
    tabs: {
      create: vi.fn(async ({ url }: { url: string }) => {
        currentTabId++;
        liveTabs.add(currentTabId);
        return { id: currentTabId, url };
      }),
      get: vi.fn(async (tabId: number) => {
        if (liveTabs.has(tabId)) {
          return { id: tabId };
        }
        throw new Error('Tab not found');
      }),
      onRemoved: {
        addListener: vi.fn((fn) => tabRemovedListeners.push(fn)),
        removeListener: vi.fn((fn) => {
          tabRemovedListeners = tabRemovedListeners.filter((l) => l !== fn);
        }),
      },
      onUpdated: {
        addListener: vi.fn((fn) => tabUpdatedListeners.push(fn)),
        removeListener: vi.fn((fn) => {
          tabUpdatedListeners = tabUpdatedListeners.filter((l) => l !== fn);
        }),
      },
      onReplaced: {
        addListener: vi.fn((fn) => tabReplacedListeners.push(fn)),
        removeListener: vi.fn((fn) => {
          tabReplacedListeners = tabReplacedListeners.filter((l) => l !== fn);
        }),
      },
    },
    storage: {
      local: {
        get: vi.fn((_keys, cb) => cb({})),
        set: vi.fn((_obj, cb) => cb && cb()),
      },
    },
  };
});

function createDummyEntries(count: number): UrlEntry[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `entry_${i + 1}`,
    raw: `https://test${i + 1}.org`,
    normalizedUrl: `https://test${i + 1}.org`,
    isValid: true,
    isDuplicate: false,
    isSelected: true,
  }));
}

describe('QueueController Integration', () => {
  it('respects Queue Mode tab limit strictly', async () => {
    const controller = new QueueController();
    const entries = createDummyEntries(10);

    // Start with limit 3
    await controller.start('queue', entries, 1, 3);

    const state = controller.getState();
    expect(state.status).toBe('running');
    expect(state.managedTabIds.length).toBe(3);
    expect(state.nextIndex).toBe(3);
    expect(liveTabs.size).toBe(3);

    controller.destroy();
  });

  it('refills exactly one slot when one managed tab closes', async () => {
    const controller = new QueueController();
    const entries = createDummyEntries(5);

    await controller.start('queue', entries, 1, 2);
    expect(controller.getState().managedTabIds.length).toBe(2);
    expect(controller.getState().nextIndex).toBe(2);

    const firstTabId = controller.getState().managedTabIds[0];
    liveTabs.delete(firstTabId);

    // Trigger tab close event
    for (const listener of tabRemovedListeners) {
      listener(firstTabId);
    }

    // Wait microtask tick
    await new Promise((r) => setTimeout(r, 50));

    const updatedState = controller.getState();
    expect(updatedState.managedTabIds.length).toBe(2); // refilled!
    expect(updatedState.nextIndex).toBe(3); // 3rd URL opened

    controller.destroy();
  });

  it('ignores removal events for unmanaged tabs', async () => {
    const controller = new QueueController();
    const entries = createDummyEntries(5);

    await controller.start('queue', entries, 1, 2);
    expect(controller.getState().nextIndex).toBe(2);

    // Emit removal for unrelated tab
    for (const listener of tabRemovedListeners) {
      listener(999999);
    }

    await new Promise((r) => setTimeout(r, 20));

    // Next index must remain 2, no extra URL opened
    expect(controller.getState().nextIndex).toBe(2);
    expect(controller.getState().managedTabIds.length).toBe(2);

    controller.destroy();
  });

  it('pauses and does not refill closed slots while paused', async () => {
    const controller = new QueueController();
    const entries = createDummyEntries(5);

    await controller.start('queue', entries, 1, 2);
    controller.pause();
    expect(controller.getState().status).toBe('paused');

    const tabId = controller.getState().managedTabIds[0];
    liveTabs.delete(tabId);
    for (const listener of tabRemovedListeners) {
      listener(tabId);
    }

    await new Promise((r) => setTimeout(r, 20));

    // Managed tabs reduced to 1, but nextIndex did NOT advance because paused!
    expect(controller.getState().managedTabIds.length).toBe(1);
    expect(controller.getState().nextIndex).toBe(2);

    // Now resume
    controller.resume();
    await new Promise((r) => setTimeout(r, 50));

    // Should now refill the available slot
    expect(controller.getState().managedTabIds.length).toBe(2);
    expect(controller.getState().nextIndex).toBe(3);

    controller.destroy();
  });

  it('stops processing without closing opened tabs', async () => {
    const controller = new QueueController();
    const entries = createDummyEntries(5);

    await controller.start('queue', entries, 1, 2);
    controller.stop();

    expect(controller.getState().status).toBe('stopped');
    // Tabs must still be alive!
    expect(liveTabs.size).toBe(2);

    // Closing a tab after stop does not dispatch new URLs
    const tabId = controller.getState().managedTabIds[0];
    liveTabs.delete(tabId);
    for (const listener of tabRemovedListeners) {
      listener(tabId);
    }

    await new Promise((r) => setTimeout(r, 20));
    expect(controller.getState().nextIndex).toBe(2);

    controller.destroy();
  });

  it('lowers limit non-destructively and pauses refills until below new limit', async () => {
    const controller = new QueueController();
    const entries = createDummyEntries(10);

    // Start with limit 4
    await controller.start('queue', entries, 1, 4);
    expect(controller.getState().managedTabIds.length).toBe(4);

    // Lower limit to 2
    controller.updateLimit(2);
    expect(controller.getState().limit).toBe(2);
    // All 4 tabs remain open
    expect(liveTabs.size).toBe(4);

    // Close one tab -> 3 remain, which is still > 2 limit -> no refill
    const tab1 = controller.getState().managedTabIds[0];
    liveTabs.delete(tab1);
    for (const listener of tabRemovedListeners) {
      listener(tab1);
    }
    await new Promise((r) => setTimeout(r, 20));
    expect(controller.getState().managedTabIds.length).toBe(3);
    expect(controller.getState().nextIndex).toBe(4); // No refill!

    // Close second tab -> 2 remain, which equals 2 limit -> no refill
    const tab2 = controller.getState().managedTabIds[0];
    liveTabs.delete(tab2);
    for (const listener of tabRemovedListeners) {
      listener(tab2);
    }
    await new Promise((r) => setTimeout(r, 20));
    expect(controller.getState().managedTabIds.length).toBe(2);
    expect(controller.getState().nextIndex).toBe(4); // No refill!

    // Close third tab -> 1 remains, which is < 2 limit -> 1 slot available, refills!
    const tab3 = controller.getState().managedTabIds[0];
    liveTabs.delete(tab3);
    for (const listener of tabRemovedListeners) {
      listener(tab3);
    }
    await new Promise((r) => setTimeout(r, 50));
    expect(controller.getState().managedTabIds.length).toBe(2);
    expect(controller.getState().nextIndex).toBe(5); // Refilled 1 item!

    controller.destroy();
  });

  it('progresses sequentially in after_load mode when tabs finish loading', async () => {
    const controller = new QueueController();
    const entries = createDummyEntries(3);

    const startPromise = controller.start('after_load', entries, 1, 10);

    // Give it a moment to dispatch first URL
    await new Promise((r) => setTimeout(r, 50));
    expect(controller.getState().nextIndex).toBe(1);

    // Simulate first tab loaded
    for (const listener of tabUpdatedListeners) {
      listener(101, { status: 'complete' });
    }

    // Give it a moment to dispatch second URL
    await new Promise((r) => setTimeout(r, 50));
    expect(controller.getState().nextIndex).toBe(2);

    // Simulate second tab loaded
    for (const listener of tabUpdatedListeners) {
      listener(102, { status: 'complete' });
    }

    // Give it a moment to dispatch third URL
    await new Promise((r) => setTimeout(r, 50));
    expect(controller.getState().nextIndex).toBe(3);

    await startPromise;
    expect(controller.getState().status).toBe('completed');

    controller.destroy();
  });

  it('refills all slots when multiple tabs are closed in rapid succession', async () => {
    const controller = new QueueController();
    const entries = createDummyEntries(20);

    // Start with limit 5
    await controller.start('queue', entries, 1, 5);
    expect(controller.getState().managedTabIds.length).toBe(5);
    expect(controller.getState().nextIndex).toBe(5);

    // Close 3 tabs rapidly (e.g. user closes 3 tabs with hotkey)
    const [t1, t2, t3] = controller.getState().managedTabIds.slice(0, 3);
    liveTabs.delete(t1);
    liveTabs.delete(t2);
    liveTabs.delete(t3);

    for (const listener of tabRemovedListeners) {
      listener(t1);
      listener(t2);
      listener(t3);
    }

    // Wait for refill queue to process
    await new Promise((r) => setTimeout(r, 100));

    const updatedState = controller.getState();
    expect(updatedState.managedTabIds.length).toBe(5); // all 3 refilled up to limit!
    expect(updatedState.nextIndex).toBe(8); // 3 new URLs dispatched!

    controller.destroy();
  });

  it('watchdog detects dead tabs and refills slots even if onRemoved was missed', async () => {
    const controller = new QueueController();
    const entries = createDummyEntries(10);

    await controller.start('queue', entries, 1, 3);
    expect(controller.getState().managedTabIds.length).toBe(3);
    expect(controller.getState().nextIndex).toBe(3);

    // Tab 1 closes while service worker was suspended (no onRemoved received)
    const deadTab = controller.getState().managedTabIds[0];
    liveTabs.delete(deadTab);

    // Watchdog ticks
    await controller.checkAndReconcileQueue();

    const state = controller.getState();
    expect(state.managedTabIds.length).toBe(3); // refilled!
    expect(state.nextIndex).toBe(4); // dispatched next URL!

    controller.destroy();
  });

  it('restores running session state without resetting to idle', async () => {
    const controller = new QueueController();
    const entries = createDummyEntries(10);

    const savedState = {
      sessionId: 'test_session_123',
      status: 'running' as const,
      mode: 'queue' as const,
      delaySeconds: 1,
      limit: 3,
      entries,
      nextIndex: 3,
      managedTabIds: [101, 102, 103],
      tabToEntryIdMap: { 101: 'entry_1', 102: 'entry_2', 103: 'entry_3' },
      entryOutcomes: {
        entry_1: 'opened' as const,
        entry_2: 'opened' as const,
        entry_3: 'opened' as const,
      },
      statusMessage: 'Queue running: 3/3 slots active',
      updatedAt: Date.now(),
    };

    // Tab 101, 102, 103 are still alive
    liveTabs.add(101);
    liveTabs.add(102);
    liveTabs.add(103);

    await controller.restoreAndResume(savedState);

    const state = controller.getState();
    expect(state.status).toBe('running');
    expect(state.sessionId).toBe('test_session_123');
    expect(state.managedTabIds.length).toBe(3);
    expect(state.nextIndex).toBe(3);

    controller.destroy();
  });

  it('handles tab replacement (onTabReplaced) and refills immediately when replaced tab closes', async () => {
    const controller = new QueueController();
    const entries = createDummyEntries(5);

    await controller.start('queue', entries, 1, 2);
    expect(controller.getState().managedTabIds.length).toBe(2);

    const oldTabId = controller.getState().managedTabIds[0];
    const newTabId = 999;
    liveTabs.delete(oldTabId);
    liveTabs.add(newTabId);

    // Trigger tab replaced event (e.g. Chrome process navigation/swap)
    for (const listener of tabReplacedListeners) {
      listener(newTabId, oldTabId);
    }

    // managedTabIds should now contain newTabId instead of oldTabId
    expect(controller.getState().managedTabIds).toContain(newTabId);
    expect(controller.getState().managedTabIds).not.toContain(oldTabId);

    // Now close the new tab
    liveTabs.delete(newTabId);
    for (const listener of tabRemovedListeners) {
      listener(newTabId);
    }

    await new Promise((r) => setTimeout(r, 50));

    // Must refill immediately!
    expect(controller.getState().managedTabIds.length).toBe(2);
    expect(controller.getState().nextIndex).toBe(3);

    controller.destroy();
  });
});

