## 1. DOM helpers

- [x] 1.1 Add `isDesktopHomePage` (or equivalent) for `www.youtube.com/` in `src/shared/youtube-dom.ts`.
- [x] 1.2 Add helpers that find every `ytd-rich-shelf-renderer` containing an `a[href*="/playables"]` link and remove each shelf's closest `ytd-rich-section-renderer`.

## 2. Feature implementation

- [x] 2.1 Create `src/features/home-playables-removal/content.ts` following the existing `Feature` lifecycle pattern.
- [x] 2.2 Activate the feature only on desktop Home.
- [x] 2.3 Remove matching shelves on activation and re-apply removal through a MutationObserver with `requestAnimationFrame` batching.
- [x] 2.4 Register the feature in `src/content.ts`.

## 3. Verification

- [x] 3.1 Add focused tests for detecting/removing Playables Shelves while preserving other Home cards.
- [x] 3.2 Run the configured project checks (`npm run check`, `npm test`).
- [x] 3.3 Manually validate on the current YouTube Home tab after extension reload: Playables Shelf is gone; other Home content remains.
