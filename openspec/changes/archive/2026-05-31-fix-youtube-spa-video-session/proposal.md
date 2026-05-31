## Why

YouTube watch-page features can fail after in-tab SPA navigation because the extension must treat a changed `v` parameter as a new per-video session even when the document does not reload. The current behavior can leave Chapters/Ask auto-open, subtitle policy, playback speed, and lifecycle logs out of sync with the active player after navigating from a previously working video.

## What Changes

- Detect watch-page video changes by the `v` query parameter instead of relying on full URL changes alone.
- Treat each new watch-page video ID as a clean session for per-video features.
- Invalidate pending async work from the previous video as soon as the active watch video changes.
- Require live player/bridge confirmation that the active player video ID matches the URL video ID before applying watch-page actions.
- Keep Chapters prioritized over Ask, with Ask as the existing quick fallback when Chapters are not confirmed within the wait window.
- Preserve per-video manual behavior semantics: the last valid subtitle action for the current video wins, while stale previous-video actions must not affect the new video.
- Make feature lifecycle logging reliable enough to diagnose SPA navigation, including concurrent activation/deactivation bursts.

## Capabilities

### New Capabilities

- `youtube-watch-video-session`: Defines a stable per-video session model for YouTube watch-page SPA navigation.

### Modified Capabilities

- `feature-registry`: Watch-page lifecycle must key video sessions by current video ID and avoid unnecessary resets for non-video URL changes.
- `youtube-watch-panel-auto-open`: Chapters/Ask state and pending work must reset safely when the watch video changes through SPA navigation.
- `audio-language-subtitle-policy`: Subtitle policy must apply to the current confirmed player video and ignore stale work from previous videos.
- `playback-speed`: Per-video language-based speed initialization must reset for each confirmed current video after SPA navigation.
- `feature-logging`: Stored logs must reliably preserve concurrent feature lifecycle events used to debug SPA navigation.

## Impact

- Affects YouTube content-script lifecycle orchestration in `src/shared/feature-registry.ts`.
- Affects watch-page features under `src/features/watch-panel-auto-open`, `src/features/audio-language-subtitle-policy`, and `src/features/playback-speed`.
- Affects shared player/session helpers around `src/shared/youtube-player*` if a common current-video confirmation helper is introduced.
- Affects persistent feature logging in `src/shared/feature-logger.ts` and background log handling in `src/background.ts`.
- Requires test coverage for SPA navigation with stale URL/player/global timing and concurrent lifecycle logging.
