## Context

The extension already contains feed-oriented content features that run through `FeatureRegistry` and react to YouTube SPA navigation plus DOM rerenders. The desktop subscriptions feed currently exposes a non-chronological `Most relevant` shelf as a `ytd-rich-section-renderer` containing a `ytd-rich-shelf-renderer` whose title text is `Most relevant`. Live inspection showed that this shelf includes duplicate video entries and a visible `Show more` button before the regular chronological `ytd-rich-item-renderer` cards.

## Goals / Non-Goals

**Goals:**

- Remove the complete `Most relevant` shelf from `www.youtube.com/feed/subscriptions`.
- Keep the behavior idempotent across initial load, SPA navigation, and feed rerenders.
- Preserve regular chronological subscription feed cards and existing extension features.
- Keep selectors localized so future YouTube markup changes are easy to patch.

**Non-Goals:**

- Supporting mobile YouTube or non-subscriptions pages.
- Hiding individual duplicated videos elsewhere in the chronological feed.
- Adding settings, toggles, storage, or user-configurable labels.
- Interacting with YouTube's native `Show more` control instead of removing the shelf.

## Decisions

1. Add a dedicated content feature for `Most relevant` shelf removal.

   Rationale: the behavior is distinct from Shorts removal and subscriptions hide controls. A separate feature keeps lifecycle, logging, and future selector fixes isolated while still following the existing `Feature` pattern.

   Alternative considered: extend `subscriptions-shorts-removal`. Rejected because Shorts removal also applies to the home feed and detects `is-shorts`; mixing a subscriptions-only title-based shelf removal into that feature would blur scope.

2. Detect the shelf by structure plus title text.

   The feature should look for `ytd-rich-shelf-renderer` elements whose title text is exactly `Most relevant`, then remove the nearest parent `ytd-rich-section-renderer`.

   Rationale: live DOM inspection showed the relevant section uses the same shelf/section structure as other rich shelves, but it does not have a unique attribute like `is-shorts`. The title text is the user-visible discriminator for this specific shelf.

   Alternative considered: remove the second `ytd-rich-section-renderer` in the grid. Rejected because positional assumptions are brittle if YouTube inserts or removes sections.

3. Use the existing MutationObserver plus `requestAnimationFrame` batching pattern.

   Rationale: YouTube feed contents can hydrate or rerender after activation. The existing feed features already use a small observer with RAF batching, which is sufficient and avoids polling.

   Alternative considered: one-shot removal during activation. Rejected because the shelf can reappear after SPA navigation or feed rerenders.

## Risks / Trade-offs

- [Risk] YouTube localizes the title away from `Most relevant` → Mitigation: keep title matching in a small helper so localized labels can be added later if needed.
- [Risk] YouTube changes the shelf markup → Mitigation: detect via the closest `ytd-rich-shelf-renderer` / `ytd-rich-section-renderer` relationship and keep the selector isolated.
- [Risk] A future chronological section also uses the same title text → Mitigation: only remove matching rich shelf sections on the desktop subscriptions feed, not arbitrary text elsewhere.
