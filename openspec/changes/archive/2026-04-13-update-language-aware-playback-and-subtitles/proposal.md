## Why

Playback speed currently persists as a global preference, so newly opened videos inherit stale state instead of starting from a predictable per-video baseline. Subtitle policy also enables English subtitles for all non-Spanish audio, but the desired behavior is narrower: only videos whose audio is neither English nor Spanish should receive automatic subtitles.

## What Changes

- Remove global playback-speed persistence for YouTube watch pages.
- Make each supported watch page start at `1.00x`, then adjust to `0.90x` when the active audio language is English.
- Keep manual playback-speed changes local to the current video instead of carrying them across future videos or tabs.
- Update subtitle policy so automatic subtitle activation applies only to videos whose audio language is neither English nor Spanish.
- Define conservative fallback behavior for unknown audio language: keep playback speed at `1.00x` and leave subtitles off.

## Capabilities

### New Capabilities

<!-- None. -->

### Modified Capabilities

- `youtube-watch-marking-extension`: change playback-speed behavior from a persisted global default to per-video, language-aware initialization with no cross-video persistence.
- `audio-language-subtitle-policy`: change automatic subtitle activation from all non-Spanish audio to only non-English, non-Spanish audio, including explicit fallback behavior for unknown language.

## Impact

- Affected code: `src/features/playback-speed/content.ts`, `src/shared/playback-speed.ts`, `src/shared/youtube-player.ts`, `src/main-world/youtube-player-bridge.ts`, `src/features/audio-language-subtitle-policy/content.ts`
- Affected behavior: watch-page playback-speed initialization and automatic subtitle selection
- No new external dependencies or APIs expected
