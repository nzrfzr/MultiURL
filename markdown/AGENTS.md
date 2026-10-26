# Agent Instructions — MultiURL

## Project goal
Build a browser extension called **MultiURL** for Google Chrome and Mozilla Firefox. It accepts a list of URLs, validates and organizes them, and opens selected URLs using configurable opening modes. Its distinguishing feature is **Queue Mode (Tab Limit)**: keep no more than a configured number of queue-managed tabs open, and open the next queued URL whenever a managed tab is closed.

## Read these documents first
1. `README.md` — product scope and commands.
2. `DESIGN.md` — authoritative UI design specification supplied by the project owner. Preserve its layout, visual hierarchy, and blue palette.
3. `ARCHITECTURE.md` — browser compatibility and runtime architecture.
4. `IMPLEMENTATION_PLANS.md` — implementation phases and acceptance criteria.
5. `TESTING.md` — required tests and manual QA.

## Non-negotiable product rules
- Support both Chrome and Firefox from one shared codebase.
- Keep browser-specific differences isolated behind a small compatibility layer and build configuration.
- Use the blue design tokens in `DESIGN.md`; do not reintroduce the original purple accent.
- URL parsing, validation, selection, and queue logic must be testable independently of browser APIs.
- Queue Mode counts **open tabs managed by the queue**, not tabs in the entire browser.
- In Queue Mode, a tab continues to occupy a slot after its page finishes loading. The slot is released only when that managed tab is closed or otherwise confirmed gone.
- Closing `n` managed tabs should allow up to `n` queued URLs to open, subject to remaining queue items and the configured limit.
- `Pause` stops dispatching new URLs but does not close already opened tabs.
- `Resume` continues dispatching according to the active mode and limit.
- `Stop` stops the current queue from opening more URLs; it does not close already opened tabs.
- Do not show “Completed” until all selected URLs have reached a terminal processing outcome, and in Queue Mode do not confuse “all URLs dispatched” with “all managed tabs closed.”
- Handle browser API errors and permission restrictions without falsely reporting success.
- Do not use remote code or remotely hosted executable dependencies.

## Implementation conventions
- Prefer TypeScript, strict type checking, small modules, and explicit types for state transitions.
- Keep UI components presentational where possible; put URL parsing, scheduling, and queue policy in separate modules.
- Use the WebExtensions API through `webextension-polyfill` where appropriate, while checking actual support and typing for each target browser.
- Generate browser-specific manifests from a shared manifest source or maintain clearly documented per-browser manifests. Do not assume Chrome and Firefox use identical background execution semantics.
- Keep persistent queue state minimal and versioned. Persist only what is needed to recover safely after popup closure or background suspension.
- Do not store browsing history or send URLs to an external service.
- Use accessible labels, visible keyboard focus, and status text in addition to color.
- Add or update tests whenever queue behavior or cross-browser behavior changes.

## Queue invariants
1. `managedOpenTabIds.length` must never intentionally exceed the configured limit.
2. Each dispatched URL is associated with at most one managed tab unless an explicit retry policy says otherwise.
3. A tab-close event is acted on only if the tab belongs to the active queue session.
4. Duplicate close events and stale events must not cause extra URLs to open.
5. The scheduler must serialize or otherwise safely coordinate queue updates to avoid race conditions.
6. Lowering the limit below the current number of managed tabs does not close tabs; it only prevents additional dispatches until the count falls below the new limit.
7. If a browser rejects a tab creation, record the failure and continue or pause according to a documented policy; never leave a phantom slot permanently occupied.
8. If the user closes the popup, the queue should continue in the background as far as the target browser's lifecycle model permits.

## Before declaring work complete
- Run unit tests and lint/type checks.
- Build both Chrome and Firefox packages.
- Verify each generated manifest and its permissions.
- Manually test Queue Mode with at least 50 URLs and a limit of 10 in both browsers.
- Report any platform-specific limitations honestly.
