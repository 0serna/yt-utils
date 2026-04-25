## Context

On the YouTube subscriptions feed page (`/feed/subscriptions`), videos that have been watched display a small red progress bar at the bottom of the thumbnail. This red bar is easy to miss, especially when scanning through many videos. Users have requested a more prominent visual indicator showing which videos have been seen.

YouTube already tracks watch progress internally. The DOM element `.ytThumbnailOverlayProgressBarHostWatchedProgressBarSegment` contains a `width` style attribute indicating the watch percentage (e.g., `style="width: 87%"`).

**Current watched indicator structure:**

```
ytd-rich-item-renderer
  └── yt-lockup-view-model
        └── div.ytLockupViewModelHost (with content-id-XXX class)
              └── a.ytLockupViewModelContentImage
                    └── yt-thumbnail-view-model
                          ├── div.ytThumbnailViewModelImage (thumbnail image)
                          └── yt-thumbnail-bottom-overlay-view-model
                                └── yt-thumbnail-overlay-progress-bar-view-model
                                      └── div.ytThumbnailOverlayProgressBarHostWatchedProgressBar
                                            └── div.ytThumbnailOverlayProgressBarHostWatchedProgressBarSegment
                                                  style="width: 87%"
```

## Goals / Non-Goals

**Goals:**

- Add a visible semi-transparent black overlay (`rgba(0, 0, 0, 0.4)`) across the thumbnail image for watched videos
- Apply to videos with 80%+ watch progress
- Display immediately on page load
- Only affect `/feed/subscriptions` page
- Follow existing codebase patterns (Feature interface, MutationObserver, DOM utilities)

**Non-Goals:**

- Do not affect Shorts in the subscriptions feed
- Not a user-configurable feature (no settings, no toggle)
- Not applying overlay based on watch history outside the current page context
- Not modifying YouTube's actual watched state - purely cosmetic overlay

## Decisions

### 1. Overlay injection point

**Decision:** Inject the overlay as a sibling to `div.ytThumbnailViewModelImage` inside `yt-thumbnail-view-model`, positioned absolutely to cover the entire thumbnail area.

**Rationale:** This approach:

- Places the overlay at the correct visual layer (above the image, below the bottom overlay with progress bar)
- Does not interfere with YouTube's existing overlay structure
- Allows CSS to handle positioning and sizing via flex/absolute layout
- Avoids complex z-index calculations

**Alternative considered:** Injecting into `div.ytThumbnailViewModelImage` as a child. Rejected because the image already has its own styling for fill/scale, and adding an overlay inside could interfere with YouTube's image rendering.

### 2. Watched threshold

**Decision:** Use 80% as the threshold for "seen" status.

**Rationale:** YouTube's own watched definition typically considers a video "watched" when the user has seen approximately 80-90% of the content. Using 80% provides a good balance and aligns with the user's explicit requirement.

### 3. Selector for detection

**Decision:** Use `.ytThumbnailOverlayProgressBarHostWatchedProgressBarSegment[style*="width: 8"]`, `[style*="width: 9"]`, and `[style*="width: 100%"]` to match 80%+ progress.

**Rationale:** The width is always a whole number percentage. Pattern matching on the style string is reliable since YouTube always sets it as an inline style.

**Alternative considered:** Using `parseFloat()` on the width value in JavaScript. This would work but requires per-element evaluation. CSS attribute selectors can filter elements at query time without JavaScript evaluation.

### 4. Implementation pattern

**Decision:** Follow the existing `subscriptions-hide` feature pattern:

- Implement as a Feature with `matchesPage()` and `activate()`/`deactivate()`
- Use MutationObserver to watch for `ytd-rich-item-renderer` additions
- Immediately process all found cards on activation

**Rationale:** The codebase already has established patterns for DOM manipulation on YouTube pages. Consistency makes the code easier to maintain and review.

### 5. Overlay styling

**Decision:** Use inline styles for the overlay div:

```css
position: absolute;
top: 0;
left: 0;
width: 100%;
height: 100%;
background: rgba(0, 0, 0, 0.6);
pointer-events: none;
z-index: 1;
```

**Rationale:** Inline styles are used by similar features in the codebase (e.g., `subscriptions-hide`). This keeps the overlay self-contained and avoids needing separate CSS files or style injection.

## Risks / Trade-offs

- **[Risk]** YouTube may change DOM structure → **Mitigation:** The feature uses relatively stable selectors, and MutationObserver allows dynamic adaptation when DOM changes
- **[Risk]** Overlay may flash or appear delayed → **Mitigation:** Immediately process cards on activation, before any deferred rendering
- **[Risk]** Performance impact from MutationObserver → **Mitigation:** Observer uses `childList` only, not subtree, to minimize overhead
- **[Trade-off]** Overlay is cosmetic only → Videos can still be clicked and watched again, which is expected behavior
- **[Trade-off]** Shorts excluded → Users cannot distinguish seen Shorts visually, but Shorts have different UX patterns and the feature scope was explicitly limited

## Open Questions

1. Should the overlay also appear on the home feed (`/`) in the future? (Out of scope for now)
2. Should the feature work on mobile/mobile-web YouTube? (Desktop only for this change)
