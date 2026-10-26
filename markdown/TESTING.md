# Testing Strategy — MultiURL

## Test layers

### Unit tests
Test pure functions without browser APIs:
- URL parsing, normalization, validation, duplicate detection.
- Statistics calculation.
- Selection and delete behavior.
- Available-slot calculation.
- Queue state transitions.
- Interval validation.
- Progress and status labels.

### Integration tests
Use a mocked browser adapter to test:
- Tab creation success/failure.
- Managed-tab registration and removal.
- Popup-to-background messaging.
- Queue pause/resume/stop.
- Persistence and reconciliation.
- Duplicate and stale tab-removal events.
- Concurrent close events and serialized refills.

### Browser QA
Run manual or automated tests in both Chrome and Firefox using the built package.

## Queue Mode acceptance scenarios

1. **Basic limit:** 50 URLs, limit 10. Starting the queue opens 10 managed tabs, with 40 waiting.
2. **One tab closed:** close one managed tab. Exactly one next URL is dispatched, assuming queue is running and items remain.
3. **Several tabs closed:** close four managed tabs. Up to four next URLs are dispatched, limited by remaining URLs and configured capacity.
4. **Load completion:** let all ten tabs finish loading. No additional URL opens solely because loading completed.
5. **Pause:** pause, close two managed tabs, and verify no replacements open until resume.
6. **Resume:** resume after the previous test. Fill available slots up to the limit.
7. **Stop:** stop, then close managed tabs. No further URLs from that stopped session open.
8. **Lower limit:** with 10 managed tabs, lower the limit to 5. No tabs are closed automatically and no new tabs open until active count drops below 5.
9. **Raise limit:** raise from 5 to 12 while fewer than 12 managed tabs are open. The scheduler fills available capacity.
10. **Queue exhausted:** fewer than 10 URLs remain. Open only those URLs and do not create empty slots.
11. **Tab creation failure:** simulate a rejected tab creation. Mark the URL failed, do not count a phantom tab, and follow the defined retry policy.
12. **Stale event:** deliver a removal event for an unmanaged or already-removed tab. It must not dispatch an extra URL.
13. **Popup closure:** close the popup while running. Queue behavior continues as supported by the browser background lifecycle.
14. **Background restart:** restore state and reconcile tab IDs without duplicate openings.
15. **Browser-specific run:** repeat key scenarios in Chrome and Firefox.

## Other required scenarios
- Empty input and whitespace-only input.
- Invalid URLs and unsupported schemes.
- Duplicate URLs, including normalized variants.
- Mixed valid and invalid lines.
- No selected URLs.
- Deleting selected items while idle.
- Pausing and stopping at the beginning, middle, and end.
- Very large URL lists and browser tab creation throttling.
- Interval of zero, negative, nonnumeric, and very large values.
- Keyboard-only interaction and visible focus.
- Narrow viewport without horizontal overflow.
- Popup reopening after a run.

## Testable invariants
- Managed open tab count does not intentionally exceed the configured limit.
- A load-complete event does not release a Queue Mode slot.
- A closed managed tab releases exactly one slot.
- Unmanaged tab events never change queue capacity.
- No success state is shown before actual API success.
- Stop does not close tabs already opened by the session.
