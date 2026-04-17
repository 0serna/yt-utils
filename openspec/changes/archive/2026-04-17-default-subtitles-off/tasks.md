## 1. Subtitle policy simplification

- [x] 1.1 Update the shared subtitle-selection logic in `src/shared/youtube-player.ts` so automatic policy resolution always targets subtitles-off and no longer selects direct English or translated English tracks.
- [x] 1.2 Remove or simplify any now-unused subtitle-selection helpers and branches that only supported automatic English caption selection, while keeping shared player snapshot data needed by other features.

## 2. Watch-page behavior preservation

- [x] 2.1 Update `src/features/audio-language-subtitle-policy/content.ts` so the feature continues to apply the initial subtitle-off default per video and still records the applied state for override detection.
- [x] 2.2 Verify the subtitle bridge path in `src/main-world/youtube-player-bridge.ts` still supports the simplified off-only policy without changing playback-speed dependencies on player snapshot audio-language data.

## 3. Verification

- [x] 3.1 Verify on supported YouTube watch pages that videos load with subtitles off even when direct English captions or English auto-translation are available.
- [x] 3.2 Verify that manually enabling subtitles after the initial load is respected for the current video and is not immediately overridden by the extension.
- [x] 3.3 Run `npm run check` and `npm run build` and resolve any issues caused by the subtitle-policy simplification.
