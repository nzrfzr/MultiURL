# Product and Technical Decisions

Record meaningful changes to these decisions with date, rationale, and impact.

## D-001 — Support Chrome and Firefox
**Decision:** The extension must support both Chrome and Firefox from the initial implementation.

**Implication:** Share application logic and UI, but build browser-compatible packages and verify background/runtime differences per browser version.

## D-002 — Queue Mode counts live managed tabs
**Decision:** A Queue Mode tab consumes a slot until that tab is closed or confirmed absent, regardless of whether its page has finished loading.

**Rationale:** The feature limits the number of tabs open at once, not merely the number of pages loading.

## D-003 — Queue only manages tabs it creates
**Decision:** The configured limit applies to tabs created and tracked by the active queue session, not all tabs in the browser.

**Rationale:** User's unrelated tabs must not consume the queue's capacity.

## D-004 — Pause and Stop do not close opened tabs
**Decision:** Pause halts future dispatches temporarily; Stop permanently halts future dispatches for the current session. Neither action closes tabs already opened.

## D-005 — Lowering the limit is non-destructive
**Decision:** If the current number of managed tabs exceeds a newly lowered limit, do not close existing tabs. Wait until enough tabs are closed before dispatching more.

## D-006 — Design source of truth
**Decision:** `DESIGN.md` is copied from the user-provided design document and is the authoritative UI reference. Its blue palette replaces the purple accent in the screenshot.

## D-007 — Distinguish dispatched from fully finished
**Decision:** In Queue Mode, “all URLs opened” does not mean all managed tabs are closed. The UI must distinguish queue exhaustion from the number of managed tabs still open.
