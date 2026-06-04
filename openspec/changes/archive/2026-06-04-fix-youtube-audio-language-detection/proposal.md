## Why

YouTube's current `getAudioTrack()` payload can expose the active audio metadata under a minified `C_` field, while the extension only reads older `hs`/`yG` shapes and sometimes falls back to caption metadata. This makes subtitle policy and language-aware playback behavior intermittent, especially during new-tab or SPA video loads where caption tracks may still be incomplete.

## What Changes

- Update active audio-language inference to recognize the current YouTube audio track metadata shape observed in production.
- Keep subtitle policy based on the active audio track, not caption-track order or stale bootstrap data.
- Ensure English-audio videos with available direct English captions are eligible for automatic subtitle activation consistently across new tabs and SPA navigations.
- Preserve existing behavior for non-English or unknown audio: subtitles stay off and playback speed follows the existing language rules.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `audio-language-subtitle-policy`: clarify and enforce active audio-language inference from current player audio-track metadata, including current YouTube metadata shapes, without treating caption metadata alone as audio language.
- `playback-speed`: ensure language-aware speed initialization uses the same corrected active audio-language inference.

## Impact

- Affected code: `src/main-world/youtube-player-bridge.ts`, `src/shared/youtube-player-model.ts`, related tests for subtitle policy, player model, bridge snapshots, and playback speed.
- Affected systems: YouTube watch-page content scripts and MAIN-world player bridge.
- No new permissions, external APIs, dependencies, or user-facing UI.
