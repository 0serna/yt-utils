## Context

The current `subscriptions-seen-overlay` feature activates on `www.youtube.com/feed/subscriptions`, scans `ytd-rich-item-renderer` cards, and dims each card's `yt-lockup-view-model` when the watched progress segment reports `width >= 80%`.

The feature also observes page mutations, but it only queues a rescan when a new `ytd-rich-item-renderer` is added. In the observed failure, YouTube had already rendered subscription cards and later exposed watched-progress indicators inside those existing cards. The current observer missed that internal hydration, leaving eligible cards undimmed until a full reload or later qualifying rerender.

## Goals / Non-Goals

**Goals:**

- Apply dimming when YouTube inserts watched-progress markup into an already-rendered subscriptions card.
- Apply dimming when YouTube updates the watched-progress segment `style` attribute after the segment exists.
- Keep the implementation small and scoped to the subscriptions seen overlay feature.
- Preserve current behavior for the 80% threshold, Shorts exclusion, SPA navigation, infinite scroll, and cosmetic-only dimming.

**Non-Goals:**

- Change the opacity value, threshold, or visual treatment.
- Introduce user settings or feature toggles.
- Replace YouTube's watched-state detection with API calls, storage, or history scraping.
- Broaden support to mobile YouTube or non-subscriptions pages.

## Decisions

### Observe Progress Indicator Hydration

The feature will treat watched-progress indicator insertion as a relevant mutation, not just card insertion. Relevant added nodes should include either a `ytd-rich-item-renderer` subtree or the progress marker subtree used to detect watched state.

Rationale: this directly addresses the failure mode where YouTube hydrates progress bars inside existing cards after the initial scan.

Alternative considered: run periodic polling while on the subscriptions page. This would be simpler conceptually but less efficient and less aligned with the existing event-driven approach.

### Observe Progress Segment Attribute Updates

The observer should include attribute observation for the `style` attribute and queue a rescan when the changed target is a watched-progress segment or lives inside a subscriptions card.

Rationale: YouTube may create the segment before assigning the final `width: 100%` inline style. Watching attribute changes closes that timing gap without repeatedly scanning on unrelated DOM churn.

Alternative considered: rely only on child-list mutations. That still misses the case where the node exists with an incomplete or later-updated width.

### Keep Rescans Coalesced

The feature should continue using a single queued `requestAnimationFrame` rescan guard so multiple rapid YouTube mutations collapse into one `ensureDimming()` pass.

Rationale: YouTube feed rendering is mutation-heavy. Coalescing avoids excessive scans while preserving responsiveness.

Alternative considered: rescan synchronously for each relevant mutation. This increases the chance of redundant work and layout pressure.

## Risks / Trade-offs

- Broader mutation observation could fire more often on YouTube's feed → mitigate by filtering to progress/card-related mutations and preserving the existing requestAnimationFrame queue.
- YouTube may rename the progress marker classes again → mitigate by keeping the detection logic localized so future selector updates are small.
- Inline opacity checks can skip cards with pre-existing inline opacity from YouTube or another extension → leave unchanged in this change because the observed bug is timing-related, not ownership-related.
