# Architecture — MultiURL

## 1. High-level design

Use one shared TypeScript application and isolate browser differences in a `platform/` adapter plus per-browser build configuration.

Suggested source layout:

```text
src/
  background/
    index.ts
    queue-controller.ts
    queue-repository.ts
    tab-events.ts
  popup/
    App.tsx
    components/
    styles/
  core/
    url-parser.ts
    url-validator.ts
    selection.ts
    scheduler.ts
    types.ts
  platform/
    browser-api.ts
    tabs.ts
    storage.ts
  shared/
    messages.ts
    constants.ts
    design-tokens.css
tests/
  unit/
  integration/
manifests/
  chrome.json
  firefox.json
scripts/
  build.ts
```

The exact UI framework may change, but keep core logic independent from DOM and browser APIs.

## 2. Browser compatibility

### Shared APIs
Use standard WebExtensions concepts for tabs, storage, runtime messaging, and tab lifecycle events. A compatibility wrapper should expose only the operations the product needs, such as:
- create a tab;
- query or confirm a managed tab;
- listen for a tab being removed;
- read/write versioned queue state;
- send commands and state updates between popup and background.

Use `webextension-polyfill` if it simplifies Promise-based APIs, but verify the library and type definitions against both targets.

### Separate build targets
Produce separate Chrome and Firefox artifacts from the same source. Keep browser-specific manifest settings in `manifests/chrome.json` and `manifests/firefox.json`, or generate them from a common manifest template.

Do not assume identical background runtime behavior. Chrome Manifest V3 commonly uses a background service worker. Firefox's supported Manifest V3 background configuration may differ by release. Verify current official browser documentation before choosing the exact Firefox background declaration and minimum supported versions.

### Permissions
Request the smallest permission set that can support the product. Likely candidates include `tabs` and storage/runtime permissions, but confirm whether each permission is actually necessary for the chosen API usage. Avoid host permissions unless required. URL opening should not require access to page contents.

## 3. Runtime responsibilities

### Popup/UI
- Accept and display pasted URL input.
- Parse and validate URLs, including duplicate detection.
- Maintain current selection and open-mode settings.
- Send explicit start/pause/resume/stop/update-limit messages to the background.
- Render state returned by the background; do not treat local UI state as authoritative for actual tab creation.
- Remain usable when reopened after the popup was closed.

### Background controller
- Own active queue sessions and tab creation.
- Serialize queue state transitions.
- Listen for managed tab removals.
- Refill free slots in Queue Mode.
- Record success/failure and update persistent state.
- Continue work after popup closure within the browser's background lifecycle constraints.

### Core modules
- `url-parser`: turns raw text into candidate entries.
- `url-validator`: normalizes and validates supported URL formats.
- `selection`: filters the list to selected, valid, non-duplicate entries according to product rules.
- `scheduler`: decides which URL may be dispatched next.
- `queue-controller`: orchestrates scheduling with browser tab APIs.
- `queue-repository`: persists recoverable state and session metadata.

## 4. Queue Mode state model

A queue session should contain at least:
- `sessionId`
- `status`: `idle | running | paused | stopped | completed | failed`
- `mode`
- `limit`
- ordered selected URL entries
- `nextIndex` or a durable pending queue
- managed tab IDs mapped to URL entry IDs
- per-entry outcome: `queued | opening | opened | failed`
- timestamps or a monotonic sequence where needed to reject stale updates
- schema version

Keep `opened` distinct from `completed`. In Queue Mode, an entry is considered dispatched/opened when tab creation succeeds, while its tab remains active and consumes a slot until removed. The whole dispatch queue can be exhausted while managed tabs remain open. The UI should communicate these states clearly, for example `All URLs opened — 10 managed tabs still open`, rather than implying all tabs were closed.

### Slot calculation
Let:
- `L` = configured limit;
- `A` = number of live managed tabs in the active session;
- `Q` = number of URLs waiting in the queue.

Available slots are:

`max(0, L - A)`

The number of URLs eligible to dispatch in the next refill is:

`min(max(0, L - A), Q)`

On a managed tab removal, remove that tab from the live set and run the scheduler again. Treat duplicate/stale removal events as no-ops.

If the user lowers `L` while `A > L`, do not close existing tabs. Dispatch remains disabled until `A < L`, at which point one slot is available; in general, refill only while `A < L`.

## 5. Race conditions and recovery

- Serialize queue mutations with a single controller or a mutex/command queue.
- Register a newly created tab as managed as soon as its ID is available.
- If tab creation fails, mark that URL failed and do not increment the live-tab count.
- If a tab is closed before its creation response is fully processed, reconcile against the browser's live tab state before dispatching more URLs.
- Ignore removal events for tabs not in the active session.
- Avoid duplicate processing after background restarts by reconciling persisted tab IDs with current browser tabs.
- Version persistent data and validate it before use.
- Define behavior if the browser restarts: recover only what can be verified; do not create duplicate tabs simply because prior state is stale.

## 6. Opening mode semantics

- **Open All:** dispatch each selected URL without a user-configured delay, while handling browser errors and avoiding a tight unbounded loop.
- **At Intervals:** dispatch each URL after the configured delay.
- **After Load:** wait for a created tab's load-complete event before dispatching the next URL. Define how failures/timeouts affect progression.
- **Queue Mode (Tab Limit):** dispatch while the number of live queue-managed tabs is below the limit; page load completion does not free a slot.

Do not conflate `After Load` with Queue Mode. One limits the number of tabs based on tab closure; the other sequences dispatch based on loading.

## 7. Messaging

Use typed messages such as:
- `START_QUEUE`
- `PAUSE_QUEUE`
- `RESUME_QUEUE`
- `STOP_QUEUE`
- `UPDATE_LIMIT`
- `GET_STATE`
- `STATE_UPDATED`

Validate messages at runtime. The background controller is the source of truth for queue status and managed tab membership.

## 8. Privacy and data
All parsing and queue operations should happen locally. Do not transmit pasted URLs to external servers. Do not collect analytics by default. See `SECURITY_AND_PRIVACY.md`.
