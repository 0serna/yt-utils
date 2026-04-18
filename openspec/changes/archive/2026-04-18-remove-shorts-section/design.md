## Context

The yt-utils browser extension injects small content features into YouTube pages via `FeatureRegistry` in `src/content.ts`. Each feature implements the `Feature` interface with `matchesPage`, `activate`, and `deactivate` methods. The registry handles YouTube SPA navigation through `yt-navigate-finish` events and a polling fallback.

The subscriptions feed page (`/feed/subscriptions`) uses a Polymer-based component hierarchy. The Shorts section is rendered as a `ytd-rich-shelf-renderer` element with an `is-shorts` attribute, wrapped in a `ytd-rich-section-renderer` container. This structure is distinct from regular video content and provides a reliable hook for detection.

Existing features like `subscriptions-seen-overlay` already demonstrate the pattern of observing DOM mutations on the subscriptions feed and applying changes conditionally. The `isShortsCard()` helper in that feature detects individual shorts cards via `ytd-reel-item-renderer` or `[class*="shorts"]`, confirming that YouTube uses consistent markers for shorts content.

## Goals / Non-Goals

**Goals:**
- Remove the Shorts shelf section from the desktop subscriptions feed entirely.
- Re-apply removal across YouTube SPA navigation and feed rerenders.
- Keep implementation minimal: a dedicated content feature following the existing pattern.
- Avoid affecting regular video cards or non-subscriptions pages.

**Non-Goals:**
- Removing individual shorts cards that appear inline with regular videos (only the dedicated shelf section).
- Supporting mobile YouTube (`m.youtube.com`), Home feed, channel pages, or other non-subscriptions surfaces.
- Adding user configuration, toggle UI, or extension popup controls.
- Intercepting network requests or calling YouTube internal APIs.

## Decisions

### Target `ytd-rich-shelf-renderer[is-shorts]` rather than heading text matching

The Shorts shelf carries an `is-shorts` attribute on its `ytd-rich-shelf-renderer` element. This is a structural marker set by YouTube's Polymer components and is more reliable than matching localized heading text like "Shorts", "Cortos", or other translations.

Alternative considered: Match the heading text content. Rejected because heading text varies by locale and would require maintaining a list of translations.

### Remove the parent `ytd-rich-section-renderer`, not just the shelf

The `ytd-rich-shelf-renderer[is-shorts]` is wrapped in a `ytd-rich-section-renderer` that also includes spacing and divider elements. Removing the entire section gives a cleaner result than hiding just the shelf.

Alternative considered: Hide via CSS (`display: none`). Rejected because DOM removal is cleaner and matches the approach used by other features. CSS hiding would leave orphaned spacing.

### Follow the existing feature pattern with MutationObserver

The feature will use a `MutationObserver` on `document.documentElement` with `requestAnimationFrame` batching, consistent with `subscriptions-hide` and `subscriptions-seen-overlay`. This ensures removal reapplies when YouTube dynamically loads content.

Alternative considered: One-shot removal on page load. Rejected because YouTube may re-render the Shorts section on scroll or SPA navigation.

### Register as a separate feature, not an extension of `subscriptions-hide`

The Shorts removal feature has a different lifecycle concern (find-and-remove vs. inject-and-maintain buttons) and different DOM targets. Keeping it separate preserves the focused, single-responsibility pattern of existing features.

Alternative considered: Extend the `subscriptions-hide` feature. Rejected because the two features have different DOM targets, different mutation observation criteria, and different cleanup logic.

## Risks / Trade-offs

- [YouTube changes the `is-shorts` attribute or removes it] → The feature stops removing Shorts but causes no harm. Could add heading-text fallback later if needed.
- [Shorts section reappears before observer fires] → The `requestAnimationFrame` batching pattern (used by other features) handles rapid DOM changes reliably.
- [Removing a section causes layout shift] → Minimal risk since the section is removed before the user scrolls to it, and YouTube's grid layout adapts to missing sections.
- [Other extensions or user styles also target Shorts] → No conflict expected since we remove at the section level, not inject competing styles.

## Migration Plan

1. Add `findShortsShelf()` and `removeShortsSection()` helpers to `src/shared/youtube-dom.ts`.
2. Create `src/features/subscriptions-shorts-removal/content.ts` implementing the `Feature` interface.
3. Register the feature in `src/content.ts`.
4. Verify Shorts section disappears on page load, SPA navigation, and feed rerenders.
5. Verify regular video cards remain unaffected.

Rollback: Remove the feature registration from `src/content.ts` and delete the feature file.

## Open Questions

None.
