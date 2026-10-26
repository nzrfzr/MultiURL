# MultiURL

A cross-browser extension for Chrome and Firefox that validates, organizes, and opens many URLs from one compact panel.

## Core capabilities
- Paste multiple URLs, one per line.
- Normalize supported input such as `https://`, `http://`, `www.` and bare domains according to a documented parsing policy.
- Display Total, Valid, Duplicates, and Invalid counts.
- Select all, select none, delete selected entries, or clear the list.
- Open selected URLs using:
  - **Open All** — dispatch all selected URLs as quickly as browser limits permit.
  - **At Intervals** — dispatch URLs with a configurable delay.
  - **After Load** — dispatch the next URL after the previous created tab reports that it has completed loading. This mode is separate from Queue Mode.
  - **Queue Mode (Tab Limit)** — keep a configurable maximum number of queue-managed tabs open; when one closes, open the next URL.
- Pause, resume, and stop processing.
- Show accurate progress and success/failure/remaining counts.
- Keep the UI aligned with `DESIGN.md`, including its blue accent palette.

## Browser support
Target:
- Google Chrome using the supported Chrome Extensions APIs and a Manifest V3 package.
- Mozilla Firefox using WebExtensions APIs and a Firefox-compatible manifest/background configuration.

The codebase should be shared. Build outputs may differ where browser manifest or background execution requirements differ. Do not assume that a Chrome service worker configuration can be copied unchanged to Firefox; verify the current support matrix when implementing and releasing.

## Key Queue Mode rule
The limit applies to tabs created and managed by the current queue session, not all tabs in the browser. A managed tab occupies a slot until it closes, even after its page has finished loading. Closing multiple managed tabs should refill the newly available slots with the same number of queued URLs, capped by the remaining queue and current limit.

`Stop` stops future dispatches but leaves already opened tabs alone. `Pause` temporarily stops dispatching and can be resumed. Reducing the limit below the number of currently open managed tabs does not close tabs; no more tabs are opened until the count drops below the new limit.

## Project documents
- `AGENTS.md` — instructions for coding agents and contributors.
- `DESIGN.md` — source-of-truth UI design specification.
- `ARCHITECTURE.md` — cross-browser architecture and state model.
- `IMPLEMENTATION_PLANS.md` — phased implementation plan.
- `TESTING.md` — test strategy and QA checklist.
- `SECURITY_AND_PRIVACY.md` — permissions and data-handling principles.
- `DECISIONS.md` — key product and technical decisions.

## Suggested implementation stack
- TypeScript
- React or another small component-based UI framework
- Vite or equivalent bundler with separate Chrome/Firefox build targets
- `webextension-polyfill` where useful
- Vitest (or equivalent) for unit tests
- Playwright or browser-specific automation where practical

This is a planning/documentation pack, not a claim that the extension implementation is already complete.
