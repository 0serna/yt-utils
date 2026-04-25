## Context

The YT Utils extension already has several features that modify the YouTube subscriptions feed:

- `subscriptions-hide` - Adds hide buttons to each video card
- `subscriptions-seen-overlay` - Shows watched status overlay
- `subscriptions-shorts-removal` - Removes Shorts shelf

These features follow a consistent pattern: they activate on the subscriptions feed page, use MutationObservers to handle dynamic content, and clean up on deactivation. The extension uses a `FeatureRegistry` to manage lifecycle.

YouTube's subscriptions feed uses a flex-based layout with `ytd-rich-item-renderer` elements as video cards. Each card defaults to ~528px width, fitting 3 per row on typical desktop resolutions (~1600px container width). By reducing card width to ~400px, 4 cards can fit per row.

## Goals / Non-Goals

**Goals:**

- Show 4 videos per row on the YouTube subscriptions feed
- Maintain video thumbnail aspect ratios (16:9) at reduced size
- Follow existing extension patterns for feature lifecycle
- Activate only on desktop subscriptions feed page
- Clean up properly on deactivation/navigation

**Non-Goals:**

- Configurable grid density (3/4/5 options) - scope to fixed 4-per-row
- Mobile/tablet support - desktop only
- Affecting other YouTube pages (home, trending, etc.)
- Persisting user preference across sessions

## Decisions

### Decision: CSS-only approach via injected stylesheet

**Rationale:** The grid layout can be modified entirely with CSS. This is simpler than manipulating individual DOM elements and handles YouTube's dynamic re-rendering automatically.

**CSS Strategy:**

```css
/* Reduce video card width to fit 4 per row */
ytd-rich-item-renderer {
  width: 400px !important;
  max-width: 400px !important;
  flex-basis: 400px !important;
}

/* Remove container max-width constraints */
ytd-rich-grid-renderer > div:nth-child(5) {
  width: 100% !important;
  max-width: none !important;
}
```

**Alternative considered:** JavaScript-based width calculation per card. Rejected because CSS handles dynamic content additions better and has lower performance overhead.

### Decision: Use existing feature pattern with `matchesPage()`

**Rationale:** The extension already has `isDesktopSubscriptionsFeedPage()` helper used by other subscription features. Reusing this maintains consistency.

**Activation scope:** `www.youtube.com/feed/subscriptions` only.

### Decision: No MutationObserver needed

**Rationale:** Since we're injecting a stylesheet, it automatically applies to dynamically added cards. Other subscription features need observers because they add per-card UI elements (buttons, overlays). This feature is purely stylistic.

**Trade-off:** If YouTube changes their CSS architecture significantly, the feature may need updates. But this risk exists with any approach.

## Risks / Trade-offs

| Risk                                            | Mitigation                                                                               |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------- |
| YouTube layout changes break the feature        | Monitor for selector changes; CSS-based approach is more resilient than DOM manipulation |
| Thumbnails appear distorted                     | Ensure aspect ratio is preserved via CSS; thumbnails are responsive by default           |
| Overlaps with other grid-modifying extensions   | Use `!important` to ensure our styles apply; users can disable if conflicts arise        |
| Very narrow screens (<1600px) may have overflow | The flex layout will wrap naturally; worst case is slightly cramped appearance           |
| YouTube A/B tests different grid structures     | Feature uses common selectors that are unlikely to change in A/B tests                   |

## Migration Plan

No migration needed - this is a new feature. Rollback is simple: remove the feature registration from `src/content.ts` and delete the feature directory.

## Open Questions

None - the approach is straightforward and builds on established patterns.
