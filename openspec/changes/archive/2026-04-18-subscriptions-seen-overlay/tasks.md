## 1. Create Feature File

- [x] 1.1 Create `src/features/subscriptions-seen-overlay/content.ts` following the Feature interface pattern
- [x] 1.2 Implement `matchesPage()` to return true only for `www.youtube.com/feed/subscriptions`
- [x] 1.3 Implement `activate()` to initialize the overlay on existing cards
- [x] 1.4 Implement `deactivate()` to clean up observers and injected overlays

## 2. Implement Overlay Detection Logic

- [x] 2.1 Create helper function `findSeenThumbnails()` to query `.ytThumbnailOverlayProgressBarHostWatchedProgressBarSegment` elements with 80%+ width using CSS attribute selectors
- [x] 2.2 Add logic to exclude Shorts (check for `ytd-reel-item-renderer` parent or Shorts-related classes)
- [x] 2.3 Create helper function `isShortsCard(card)` to detect Shorts entries

## 3. Implement Overlay Injection

- [x] 3.1 Create helper function `injectOverlay(thumbnail)` to add the overlay div to `yt-thumbnail-view-model`
- [x] 3.2 Apply inline styles: `position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.6); pointer-events: none; z-index: 1`
- [x] 3.3 Insert overlay as sibling to `div.ytThumbnailViewModelImage` inside `yt-thumbnail-view-model`
- [x] 3.4 Create helper function `removeOverlay(thumbnail)` to clean up overlay when deactivating

## 4. Implement MutationObserver

- [x] 4.1 Set up observer on `document.documentElement` with `childList: true` and `subtree: true`
- [x] 4.2 Filter mutations to only process `ytd-rich-item-renderer` additions
- [x] 4.3 On new cards, call `findSeenThumbnails()` and inject overlays for eligible videos
- [x] 4.4 Ensure observer is disconnected on `deactivate()`

## 5. Register Feature

- [x] 5.1 Import `subscriptionsSeenOverlayFeature` in `src/content.ts`
- [x] 5.2 Register the feature with `registry.register(subscriptionsSeenOverlayFeature)`

## 6. Verify and Test

- [x] 6.1 Run lint/typecheck (`npm run lint`, `npm run typecheck` or equivalent)
- [x] 6.2 Test on `www.youtube.com/feed/subscriptions` to verify seen videos get overlay
- [x] 6.3 Test that Shorts do not get overlay
- [x] 6.4 Test that newly loaded (infinite scroll) videos get overlay if eligible
