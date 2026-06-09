## 1. Scope and Detection

- [x] 1.1 Replace subscriptions-only page matching with desktop `www.youtube.com` matching while excluding mobile and embeds.
- [x] 1.2 Generalize card scanning so eligible roots across desktop YouTube list surfaces are evaluated for a `yt-lockup-view-model` target.
- [x] 1.3 Change the native watched-progress threshold from 80% to 90%.
- [x] 1.4 Preserve Shorts exclusion across all scanned surfaces.

## 2. Dimming Ownership and Cleanup

- [x] 2.1 Add an extension-owned marker attribute when applying `opacity: 0.4` to a `yt-lockup-view-model`.
- [x] 2.2 Update the already-dimmed sentinel to use the extension-owned marker instead of any non-empty inline opacity.
- [x] 2.3 Update deactivation cleanup to restore opacity only on marked `yt-lockup-view-model` elements and remove the marker.
- [x] 2.4 Preserve unowned inline opacity on `yt-lockup-view-model` elements during deactivation.

## 3. Dynamic Updates

- [x] 3.1 Update mutation relevance checks so newly inserted eligible cards and watched-progress segments trigger rescans outside the subscriptions feed.
- [x] 3.2 Preserve requestAnimationFrame batching for broad desktop YouTube mutation handling.
- [x] 3.3 Ensure delayed insertion or style updates of watched-progress segments dim eligible existing cards without page reload.

## 4. Verification

- [x] 4.1 Add or update automated coverage for desktop YouTube non-subscriptions surfaces, including channel Videos tab and watch-page recommendations.
- [x] 4.2 Add or update automated coverage for the 90% threshold, below-threshold cards, unsupported wrappers, Shorts exclusion, and owned cleanup.
- [x] 4.3 Run `npm run check`.
- [x] 4.4 Build the extension with `npm run build` and manually validate on `https://www.youtube.com/@rachelsenglish/videos` after reloading the extension.
