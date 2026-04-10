## Why

The extension currently helps with watch-page actions but offers no in-page control for playback speed, so users still have to open YouTube's native settings for a simple adjustment like `1.0x` to `0.9x`. Adding an inline speed control keeps that action visible, repeatable, and consistent across future videos without introducing a separate settings surface.

## What Changes

- Add a desktop-only inline playback-speed control to the standard YouTube watch-page action row.
- Render a visible `- 1.0x +` style control that adjusts speed in `0.1` increments and disables decrement/increment buttons at configured bounds.
- Apply playback-speed changes immediately to the current video by setting `HTMLVideoElement.playbackRate` directly.
- Persist the most recent playback speed locally as a global default for future watch pages and future tabs.
- Reapply the saved playback speed automatically when a new supported watch page loads in a tab.
- Keep existing open tabs unsynchronized after initial load so only future navigations and future tabs receive the latest saved value.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `youtube-watch-marking-extension`: expand the desktop watch-page experience to include an inline global playback-speed control with persisted defaults and automatic reapplication on future supported videos.

## Impact

- Affects `src/content.ts` and `src/shared/feature-registry.ts` because another watch-page feature will need to be registered and activated alongside the existing inline button.
- Adds a new desktop watch-page content feature responsible for rendering the speed control, reading and writing persisted speed state, and applying `video.playbackRate` to the current page.
- Requires extension storage usage for the saved global playback-speed preference and watch-page lifecycle handling for YouTube SPA navigation.
