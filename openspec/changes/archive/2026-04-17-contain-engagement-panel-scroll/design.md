## Context

This project already contains local scroll containment for the YouTube `Ask` panel, applied inside the existing watch-page automation feature. Live inspection of the current YouTube watch UI shows that other engagement panels use the same outer `ytd-engagement-panel-section-list-renderer` shell but do not share a single internal scroll container:

- `Ask` uses `yt-section-list-renderer`.
- `In this video` and `Chapters` use a macro-markers renderer with `div#contents` as the effective scroller.
- `Transcript` can swap the same panel to a different internal renderer and scroll container.

That means an Ask-specific selector is too narrow for the desired behavior. The design needs to normalize scroll containment at the engagement-panel level without accidentally patching unrelated nested controls such as textareas.

## Goals / Non-Goals

**Goals:**

- Keep wheel scrolling inside the currently expanded engagement panel when that panel has its own main content scroller.
- Extend the existing contained-scroll experience beyond `Ask` to `In this video`, `Chapters`, and `Transcript` views.
- Survive YouTube rerenders, SPA navigation, and tab/view switches inside a panel.
- Keep the fix local to watch-page engagement panels without intercepting global document scroll events.

**Non-Goals:**

- Do not change which panel opens, closes, or becomes active.
- Do not redesign panel layouts or alter panel content rendering.
- Do not guarantee containment for arbitrary nested mini-scrollers such as textareas, dropdowns, or transient menus inside a panel.
- Do not introduce background scripts, persisted state, or external dependencies.

## Decisions

1. Introduce a separate engagement-panel containment feature.
   - The current Ask feature is responsible for auto-opening `Ask`; broadening it to all panel variants would mix two concerns with different scopes.
   - A dedicated watch-page feature can observe engagement panels regardless of whether `Ask` is present.
   - Alternatives considered: continue extending `ask-auto-open`. Rejected because the new behavior applies even when `Ask` is absent and would make the feature name and mutation scope misleading.

2. Patch the primary scroll container inside each expanded engagement panel.
   - The implementation should inspect the expanded panel subtree and select the main content scroller rather than hardcoding a single selector.
   - The primary candidate should be a sufficiently large vertical scroller in the active panel body, excluding small nested controls like chat inputs.
   - Alternatives considered: maintain a static selector map per panel type. Rejected because `In this video`, `Chapters`, and `Transcript` can swap internal renderers while keeping the same outer panel target.

3. Use CSS scroll containment as the first-line mechanism.
   - Apply `overscroll-behavior-y: contain` to the chosen panel scroller.
   - This matches the existing Ask behavior and avoids invasive document-level wheel interception.
   - Alternatives considered: preventing wheel events on the page or globally trapping scroll events. Rejected because those approaches are more fragile and risk interfering with normal watch-page scrolling outside the panel.

4. Re-sync containment whenever YouTube mutates the active panel surface.
   - The feature should observe the watch-page DOM and reapply containment when an engagement panel becomes visible, rerenders, or swaps views.
   - Alternatives considered: one-time initialization after navigation. Rejected because YouTube frequently rebuilds panel internals after load.

## Risks / Trade-offs

- [Primary scroller detection may choose the wrong element for a future panel variant] → Mitigate by preferring large visible vertical scrollers and keeping the heuristic isolated and easy to adjust.
- [YouTube may rename or restructure engagement panel internals] → Mitigate by anchoring on the stable outer engagement panel element and limiting assumptions about inner renderer names.
- [Some panels may already contain scroll natively] → Mitigate by making the sync idempotent and only overriding containers that still use the default overscroll behavior.
- [CSS containment might not cover every browser edge case] → Mitigate by keeping the design open to an event-based fallback only if manual verification shows residual scroll leakage.

## Migration Plan

- Add the new feature to the watch-page content-script registry.
- Roll out containment logic without changing existing Ask auto-open behavior.
- If rollback is needed, remove the dedicated containment feature and leave panel-opening behavior untouched.

## Open Questions

- Is CSS `overscroll-behavior-y: contain` sufficient for all supported Chromium states on YouTube watch pages, or will some panel variants still need a targeted wheel-event fallback?
