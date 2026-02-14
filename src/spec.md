# Specification

## Summary
**Goal:** Make the “No” button reliably visible and functional during the question phase, with correct positioning, movement bounds, and attempt-based message logic.

**Planned changes:**
- Fix initial rendering/visibility of the “No” button so it appears immediately with the “Yes” button after the intro countdown (no overlap, no hidden stacking/opacity/position issues).
- Adjust initial layout and stacking/positioning so “Yes” and “No” are clearly readable and non-overlapping on both desktop and mobile viewports.
- Constrain the “No” button’s evasive movement to stay fully within the visible bounds of the question phase button area (never off-screen or under other UI such as the footer).
- Correct attempt counter/state handling so dramatic message escalation triggers on the intended hover attempt milestones and the “No” button shrink behavior updates consistently without stale state.

**User-visible outcome:** When the question appears, users immediately see both “Yes” and “No” buttons; “No” dodges the cursor but always stays within the question button area, and the escalating messages/shrinking behavior triggers at the intended attempt counts.
