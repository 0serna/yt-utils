## Context

The extension already removes feed shelves through dedicated content features (`subscriptions-shorts-removal`, `subscriptions-most-relevant-removal`) registered in `FeatureRegistry`. Live inspection of desktop Home showed a Playables Shelf rendered as `ytd-rich-shelf-renderer` inside `ytd-rich-section-renderer`, with header links to `/playables` and `ytd-mini-game-card-view-model` cards. Unlike Shorts, there is no `is-playables` attribute; unlike Most relevant, title text is unnecessary because `/playables` is a stable, language-independent marker.

## Goals / Non-Goals

**Goals:**

- Remove every Playables Shelf from desktop Home (`www.youtube.com/`).
- Detect shelves via `/playables` links, not localized title text.
- Keep removal idempotent across initial load, SPA navigation, and feed rerenders.
- Preserve other Home shelves and video cards.

**Non-Goals:**

- Supporting subscriptions, search, watch, `/playables`, or mobile YouTube.
- Clicking YouTube's native "Not interested" control.
- CSS-only hiding.
- Settings, toggles, or storage.

## Decisions

1. Add a dedicated `home-playables-removal` content feature.

   Rationale: scope is Home-only and detection differs from Shorts (`is-shorts`) and Most relevant (title text). A separate feature keeps lifecycle and logging isolated, matching existing shelf-removal features.

   Alternative considered: extend `subscriptions-shorts-removal` / a shared "home feed controls" feature. Rejected because Shorts already spans Home + subscriptions with a different detector, and bundling would blur page scope.

2. Detect Playables Shelves by `a[href*="/playables"]` inside `ytd-rich-shelf-renderer`, then remove the closest `ytd-rich-section-renderer`.

   Rationale: live DOM showed header and card links under `/playables`. Href matching is language-independent and more precise than title text. Removing the section clears spacing/dividers like the other shelf features.

   Alternative considered: detect via `ytd-mini-game-card-view-model` only. Rejected as secondary — component reuse elsewhere could false-positive; `/playables` is the product identity of the shelf.

   Alternative considered: title match on "YouTube Playables". Rejected because localization would break detection (and Most relevant already shows that pain).

3. Remove silently from the DOM; do not click "Not interested".

   Rationale: deterministic, no i18n menu dependency, no writing YouTube account preferences. Matches Shorts / Most relevant behavior.

4. Use MutationObserver + `requestAnimationFrame` batching; remove all matching shelves.

   Rationale: same proven pattern as existing shelf features; Home can reinsert shelves after hydration or scroll.

## Risks / Trade-offs

- [Risk] YouTube changes Playables URLs away from `/playables` → Mitigation: keep detection in one helper in `youtube-dom.ts` so the selector is easy to patch; mini-game cards remain a fallback candidate later.
- [Risk] Unrelated Home content links to `/playables` inside a normal shelf → Mitigation: require the link to live under a `ytd-rich-shelf-renderer` before removing its section.
- [Risk] Client-only removal means the shelf can reappear on hard reload until the observer runs → Mitigation: remove on activate and on mutations; acceptable trade-off vs native dismiss.
