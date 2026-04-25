## Context

The extension already removes the Shorts shelf from the desktop subscriptions feed through a dedicated content feature registered in `src/content.ts`. That feature matches only `www.youtube.com/feed/subscriptions`, removes a `ytd-rich-shelf-renderer[is-shorts]` section, and uses a `MutationObserver` with `requestAnimationFrame` batching so the removal reapplies after YouTube rerenders the feed.

Exploration against the live desktop home feed showed that YouTube renders a structurally similar Shorts row there as well: the shelf still uses `ytd-rich-shelf-renderer[is-shorts]` and is wrapped by `ytd-rich-section-renderer`, which means the current structural detection strategy remains valid outside subscriptions. The main gap is page scope. A smaller secondary issue is that the shared helper currently removes only the first matching shelf, while home is a more likely candidate for multiple Shorts shelves over time.

## Goals / Non-Goals

**Goals:**

- Extend the existing Shorts-shelf removal behavior to the desktop home feed without changing how the subscriptions feed works.
- Keep using structural DOM markers rather than localized text matching.
- Preserve idempotent behavior across initial page load, YouTube SPA navigation, and feed rerenders.
- Remove every matching Shorts shelf section rendered on a supported desktop feed surface.

**Non-Goals:**

- Supporting watch pages, channel pages, Shorts playback pages, search results, or mobile YouTube.
- Replacing DOM removal with preference-setting flows such as clicking `Show fewer Shorts`.
- Adding configuration, per-surface toggles, or extension UI.
- Changing unrelated feed features such as subscriptions hide buttons or seen overlays.

## Decisions

### Broaden page matching to a shared supported-feed predicate

The feature should stop thinking in terms of only the subscriptions feed and instead match a shared predicate for supported desktop feed surfaces: subscriptions and home.

This keeps the feature logic aligned with the actual requirement, avoids duplicating the same removal feature for two nearly identical feeds, and localizes page-scope knowledge in shared DOM helpers.

Alternative considered: create a second home-only Shorts-removal feature. Rejected because both surfaces use the same DOM marker, lifecycle pattern, and cleanup behavior, so splitting the logic would duplicate selectors and observation code.

### Keep removing `ytd-rich-section-renderer` around `ytd-rich-shelf-renderer[is-shorts]`

The implementation should continue removing the enclosing section rather than hiding or mutating inner shelf content.

This preserves the cleaner layout already established for subscriptions and matches what live inspection on home showed: the Shorts shelf is still wrapped in a removable section container.

Alternative considered: trigger YouTube's shelf-level `Show fewer Shorts` action from the home-feed menu. Rejected because the existing feature is immediate DOM cleanup, not preference automation, and YouTube may rate-limit, persist, localize, or otherwise vary that menu action independently of the structural shelf markup.

### Update shared removal helpers to handle all matching shelves

The helper should remove all matching Shorts sections found on a supported page instead of only the first match.

This makes the feature more robust on the home feed, where future experiments or deeper scrolling may introduce additional Shorts shelves, and it avoids forcing the observer loop to remove one shelf per mutation cycle.

Alternative considered: leave single-shelf behavior in place and rely on repeated observer callbacks. Rejected because it makes correctness depend on incidental rerenders and leaves avoidable timing gaps.

### Preserve the existing observer pattern

The feature should keep the current `MutationObserver` plus `requestAnimationFrame` batching strategy.

That pattern already fits YouTube's SPA-driven DOM churn, is proven in the existing subscriptions implementation, and does not require new infrastructure.

Alternative considered: replace observation with one-shot removal during activation. Rejected because both subscriptions and home can rerender feed sections after load.

## Risks / Trade-offs

- [Home feed uses the same `is-shorts` marker today but YouTube changes it on one surface later] -> Keep selectors centralized in shared DOM helpers so a future selector fix stays localized.
- [Removing all matching shelves is broader than the current helper] -> Constrain the feature with explicit supported-page matching so the broader helper does not run on unsupported surfaces.
- [The home feed eventually contains non-removable Shorts variants that are not wrapped in `ytd-rich-section-renderer`] -> Continue using section-level removal and treat unmatched variants as a safe no-op rather than adding brittle fallbacks now.
- [Future requirements may want separate control over subscriptions and home behavior] -> The initial design keeps one shared feature for minimalism; per-surface toggles can be added later if product needs change.

## Migration Plan

1. Introduce or extend a shared helper that identifies supported desktop feed pages, covering both `www.youtube.com/feed/subscriptions` and `www.youtube.com/`.
2. Update the Shorts-removal feature so `matchesPage()` uses that broader supported-feed predicate.
3. Expand the shared Shorts-removal helper to remove every matching Shorts shelf section on the current page.
4. Verify the feature still removes Shorts on subscriptions, now also removes Shorts on home, and remains inactive on unsupported surfaces.

Rollback is straightforward: restore subscriptions-only page matching and single-surface behavior in the Shorts-removal feature.

## Open Questions

None.
