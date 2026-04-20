## 1. Refactor subscriptions-seen-overlay content.ts

- [x] 1.1 Remove `OVERLAY_CLASS` constant and all references to it
- [x] 1.2 Replace `injectOverlay(thumbnail)` with `applyDimming(cardLockup)` that sets `opacity: 0.4` on `yt-lockup-view-model`
- [x] 1.3 Replace `removeAllOverlays()` with `removeAllDimming()` that clears `opacity` style from all dimmed `yt-lockup-view-model` elements
- [x] 1.4 Update `ensureOverlay(card)` to find `yt-lockup-view-model` inside the card and call `applyDimming` instead of `injectOverlay`
- [x] 1.5 Update the "already dimmed" sentinel check from `thumbnail.querySelector(.\${OVERLAY_CLASS})` to checking if `cardLockup.style.opacity` is already set
- [x] 1.6 Remove `findThumbnailViewModel()` function (no longer needed since we target `yt-lockup-view-model` directly)
- [x] 1.7 Update MutationObserver filter to no longer exclude `.\${OVERLAY_CLASS}` nodes (simplify the filter logic)

## 2. Validate and test

- [x] 2.1 Run `npm run build` to verify no TypeScript errors
- [x] 2.2 Run `npm run check` to verify lint, format, and type checks pass
- [x] 2.3 Test in browser: verify seen video cards are dimmed (opacity 0.4) on subscriptions feed
- [x] 2.4 Test in browser: verify unseen video cards remain fully visible
- [x] 2.5 Test in browser: verify Shorts cards are not affected
- [x] 2.6 Test in browser: verify clicking a dimmed card still navigates to the video
- [x] 2.7 Test in browser: verify feature deactivation restores full opacity to all cards
