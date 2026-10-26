# Implementation Plan — MultiURL

## Delivery strategy
Implement in small phases with working builds after each phase. Chrome and Firefox are release targets from the start, not a later port.

## Phase 0 — Project setup
- [ ] Initialize TypeScript, bundler, linting, formatting, and test runner.
- [ ] Create Chrome and Firefox build targets.
- [ ] Add manifest validation to the build.
- [ ] Add CI tasks for type-check, lint, unit tests, and both browser builds.
- [ ] Establish the design tokens from `DESIGN.md`.
- Acceptance: both packages build from the same source tree; no platform-specific code is scattered through UI components.

## Phase 1 — URL parsing and list model
- [ ] Define a URL entry type with stable ID, raw input, normalized URL, validity, duplicate state, and selected state.
- [ ] Support one URL per line and documented common separators.
- [ ] Normalize `www.` and bare-domain inputs safely; prefer `https://` when adding a scheme, unless product requirements specify otherwise.
- [ ] Validate allowed protocols; reject `javascript:`, `data:`, `file:` and other unsupported schemes.
- [ ] Define duplicate policy (recommended: compare normalized URLs, optionally ignoring a trailing slash only when semantics remain clear).
- [ ] Implement Total, Valid, Duplicates, Invalid counts.
- [ ] Unit-test blank lines, whitespace, punctuation, query strings, fragments, internationalized domains, malformed hosts, duplicate variants, and unsupported schemes.
- Acceptance: parsing is deterministic and does not open tabs.

## Phase 2 — UI foundation
- [ ] Build the layout in `DESIGN.md`: header, input, statistics, list controls, URL list, mode controls, progress, process controls, footer.
- [ ] Apply blue design tokens exactly; avoid purple legacy accents.
- [ ] Add responsive behavior for wide and narrow popup widths.
- [ ] Add keyboard focus, accessible labels, tooltips/status text, and disabled states.
- [ ] Implement selection, select none, delete selected, clear, and selected-only opening.
- Acceptance: all list interactions work with mocked data and match the design specification.

## Phase 3 — Browser adapter and basic opening
- [ ] Implement `platform` adapter for tab creation, tab events, messaging, and storage.
- [ ] Implement Open All.
- [ ] Implement At Intervals with positive interval validation.
- [ ] Implement After Load using tab loading events and a documented timeout/failure policy.
- [ ] Show truthful success/failure/remaining counts.
- [ ] Test permissions and error handling in both browsers.
- Acceptance: selected valid URLs open in both Chrome and Firefox, and the popup can close without corrupting state.

## Phase 4 — Queue Mode (Tab Limit)
- [ ] Add Queue Mode as a fourth opening mode.
- [ ] Add limit control with a sensible default (recommended initial default: 10) and a positive integer range.
- [ ] Track only tabs created by the active queue session.
- [ ] Keep a tab slot occupied until the corresponding tab is removed, not until page load completes.
- [ ] On one or more tab removals, refill exactly the available slots, capped by queue length and limit.
- [ ] Pause stops refills; Resume restarts refills; Stop prevents further dispatches without closing opened tabs.
- [ ] If limit is lowered below current active count, leave existing tabs open and wait until the count is below the limit before opening more.
- [ ] Serialize scheduling and make duplicate/stale tab events harmless.
- [ ] Recover/reconcile state after popup closure and background lifecycle interruptions.
- [ ] Clearly distinguish “all URLs dispatched” from “no managed tabs remain open.”
- Acceptance: with 50 URLs and limit 10, never intentionally exceed 10 managed tabs; closing 1/4 tabs opens 1/4 replacements; loading completion alone does not release a slot.

## Phase 5 — Persistence and recovery
- [ ] Persist versioned queue state where needed.
- [ ] On popup reopen, restore input/list and request authoritative queue status from background.
- [ ] On background restart, reconcile stored managed tab IDs against live browser tabs.
- [ ] Handle browser restart or missing tabs without duplicating already-open URLs.
- Acceptance: closing and reopening the popup does not reset or duplicate a running queue.

## Phase 6 — Cross-browser validation
- [ ] Verify manifest permissions and background behavior on supported Chrome versions.
- [ ] Verify manifest permissions and background behavior on supported Firefox versions.
- [ ] Confirm API adapter behavior for tab creation, tab removal, runtime messaging, and storage.
- [ ] Document minimum supported browser versions and any differences.
- [ ] Build separate installable packages.
- Acceptance: same functional tests pass on both browsers, with documented platform-specific caveats.

## Phase 7 — Release readiness
- [ ] Add versioning and release notes.
- [ ] Add README installation instructions for unpacked development builds.
- [ ] Audit permissions and privacy claims.
- [ ] Test empty, invalid-only, duplicate-heavy, large input, and tab-creation-failure scenarios.
- [ ] Verify no remote executable code, secrets, or URL telemetry.
- [ ] Prepare separate Chrome and Firefox artifacts.
- Acceptance: reproducible builds, clean test suite, and no unresolved critical queue race conditions.

## Definition of done
- All acceptance criteria above are met.
- `DESIGN.md` is followed.
- Chrome and Firefox builds are produced from the shared codebase.
- Queue Mode obeys the tab-limit invariants.
- Tests, lint, and type checks pass.
- Known browser differences are documented rather than hidden.
