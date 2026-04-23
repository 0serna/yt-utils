## 1. Mutation Detection

- [x] 1.1 Update `subscriptions-seen-overlay` mutation filtering to treat watched-progress marker insertion inside existing subscriptions cards as relevant.
- [x] 1.2 Observe `style` attribute changes and queue a rescan when a watched-progress segment's width may have changed.
- [x] 1.3 Preserve existing coalescing so repeated YouTube mutations schedule at most one pending `ensureDimming()` pass per animation frame.

## 2. Behavior Preservation

- [x] 2.1 Confirm seen standard videos at 80% or more still receive `opacity: 0.4` on their `yt-lockup-view-model`.
- [x] 2.2 Confirm unwatched videos, below-threshold videos, Shorts, and unsupported pages remain unaffected.
- [x] 2.3 Confirm deactivation still removes opacity from dimmed `yt-lockup-view-model` elements.

## 3. Verification

- [x] 3.1 Run `npm run check`.
- [x] 3.2 Build the extension with `npm run build`.
- [x] 3.3 Validate manually on `www.youtube.com/feed/subscriptions` after extension reload: initial load, SPA navigation into subscriptions, and delayed/dynamic feed updates dim eligible seen cards without a page reload.
