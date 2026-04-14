## Context

The `Ask` panel already opens automatically on supported YouTube watch pages. The remaining UX issue is scroll chaining: once the chat reaches its scroll boundary, wheel input can propagate to the YouTube page behind it.

The scrollable element is inside the engagement panel itself, so the fix should stay local to the `Ask` surface and not affect the rest of the watch page.

## Goals / Non-Goals

**Goals:**
- Keep scroll input contained within the `Ask` panel.
- Prevent the YouTube watch page from scrolling when the user is interacting with the chat.
- Preserve the existing auto-open behavior and overall watch-page flow.

**Non-Goals:**
- Do not change how the chat content loads or renders.
- Do not intercept page scroll outside the `Ask` surface.
- Do not add new persistent state or background coordination.

## Decisions

1. Apply scroll containment to the panel’s own scroll container.
   - The effective scroller is `yt-section-list-renderer` inside `ytd-engagement-panel-section-list-renderer[target-id="PAyouchat"]`.
   - Set `overscroll-behavior-y: contain` on that element so wheel/touch scroll does not chain to the page.
   - Alternatives considered: blocking wheel events globally or on `document`. Those are more invasive and risk breaking unrelated page scrolling.

2. Reapply containment after YouTube rerenders the panel.
   - YouTube frequently mutates the watch page DOM, so the style must be reasserted when the `Ask` surface is recreated.
   - The existing mutation-observer-driven feature flow is a good fit for this.
   - Alternatives considered: one-time initialization only. That is too fragile for YouTube’s dynamic DOM.

3. Keep the fix scoped to the existing `ask-auto-open` feature.
   - The containment behavior belongs with the `Ask` panel automation because it only matters when that panel exists.
   - Splitting it into a separate feature would add coordination overhead without a clear benefit.

## Risks / Trade-offs

- [YouTube may change the scroll container selector] → Mitigate by keying off the engagement panel target and keeping the selector narrow but replaceable.
- [CSS containment may not be enough in every browser state] → Mitigate with a fallback event-based guard only if testing shows leakage remains.
- [Reapplying styles too aggressively could cause churn] → Mitigate by only syncing when the panel or its descendants mutate.

## Migration Plan

- No data migration is required.
- Ship the containment update with the existing `ask-auto-open` feature.
- If a rollback is needed, remove the containment logic and leave auto-open intact.

## Open Questions

- Is CSS `overscroll-behavior-y: contain` sufficient in all supported browsers, or does the panel need a wheel-event fallback?
