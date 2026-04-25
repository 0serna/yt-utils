## Context

`youtube-ask-auto-open` already activates on YouTube watch-page navigation, including SPA transitions. The current implementation derives the active video from the URL and uses Ask panel DOM state to decide whether the current video is already handled. During SPA navigation, YouTube can temporarily leave the previous video's expanded Ask panel in the DOM while the new video's watch UI is still settling. That stale panel can be mistaken for the current video's Ask state, causing the feature to mark the new video as complete too early.

## Goals / Non-Goals

**Goals:**

- Prevent stale Ask DOM from a previous video from suppressing auto-open on the current video.
- Keep the change scoped to the Ask auto-open feature without introducing new dependencies.
- Preserve the current behavior that avoids reopening Ask after a user manually closes it during the same video session.

**Non-Goals:**

- Redesign the full feature lifecycle registry.
- Guarantee Ask support for every YouTube experiment or layout variant.
- Add user-facing configuration, telemetry, or diagnostics as part of this change.

## Decisions

### Treat Ask readiness as current-session evidence, not just DOM presence

The feature should only consider Ask "already open" for a video after observing evidence tied to the current navigation session, rather than any expanded panel element found in the DOM.

Why:

- URL changes can happen before old watch-page DOM is fully removed.
- A stale expanded panel is not reliable proof that the current video's Ask surface is open.

Alternatives considered:

- Trust any expanded Ask panel found after navigation. Rejected because it matches the current bug.
- Depend only on the feature registry's navigation events. Rejected because registry timing alone does not guarantee that the new watch DOM has settled.

### Wait for current-video Ask UI to settle before declaring completion

The feature should continue evaluating the new video's Ask state until it can tell whether the current video's Ask UI is expanded, hidden, or unavailable, instead of immediately completing when it sees a lingering expanded panel.

Why:

- This preserves current retry behavior while removing the false-positive completion path.
- It keeps the implementation local to `src/features/ask-auto-open/content.ts`.

Alternatives considered:

- Force-close or remove the lingering panel during navigation. Rejected because it mutates YouTube state aggressively and could interfere with user actions.
- Add a fixed delay before every sync. Rejected because timing-based waits alone are brittle across devices and layouts.

### Preserve best-effort, silent failure behavior

If YouTube changes the Ask entry point or panel behavior, the feature should still fail quietly instead of throwing or blocking the page.

Why:

- The extension already treats Ask automation as opportunistic.
- This bug fix is about correctness during navigation, not changing the product's tolerance for missing UI.

Alternatives considered:

- Surface errors to the user. Rejected as out of scope for a targeted bug fix.

## Risks / Trade-offs

- [Heuristic mismatch with future YouTube DOM changes] -> Keep the logic narrowly focused on current-session evidence and existing Ask selectors so future fixes remain localized.
- [Longer settling window could slightly delay auto-open] -> Reuse the existing polling and observer model rather than adding large fixed waits.
- [The Ask feature may still be unavailable on some videos or experiments] -> Preserve the current no-op behavior when Ask never becomes available.

## Migration Plan

No data migration or rollout sequencing is required. The change is limited to content-script behavior on supported YouTube watch pages. Rollback is a straightforward revert of the Ask auto-open logic if regressions appear.

## Open Questions

- Whether this session-settled approach should remain local to `youtube-ask-auto-open` or later be generalized for other SPA-sensitive features.
