## 1. Playback speed state and persistence

- [x] 1.1 Add shared constants and storage helpers for the global playback-speed preference, including `0.5x` to `2.0x` bounds, `0.1` stepping, and `1.0x` default normalization.
- [x] 1.2 Implement watch-page initialization logic that reads the saved playback speed once per page activation and treats it as the local starting state for that tab instance.
- [x] 1.3 Apply the selected playback speed directly to the current page's `HTMLVideoElement` and reapply it when a newly initialized supported watch page exposes its video element.

## 2. Inline desktop watch-page control

- [x] 2.1 Add and register a dedicated watch-page content feature for playback speed alongside the existing mark-as-seen feature.
- [x] 2.2 Render a single inline `- currentSpeed +` control in the desktop watch-page action row and keep it aligned with the existing inline action styling.
- [x] 2.3 Implement decrement and increment interactions that update the visible value immediately, clamp to bounds, disable invalid actions at the limits, and persist the latest selection as the new global default.
- [x] 2.4 Add idempotent watch-page rerender and SPA-navigation handling so the playback-speed control remains present without duplication on supported desktop watch pages.

## 3. Verification

- [x] 3.1 Verify that changing the inline control updates `video.playbackRate` immediately on the current supported watch page.
- [x] 3.2 Verify that a saved playback speed is applied automatically to future supported videos and future tabs.
- [x] 3.3 Verify that an already-open supported watch tab does not change automatically when another tab saves a different playback speed value.
