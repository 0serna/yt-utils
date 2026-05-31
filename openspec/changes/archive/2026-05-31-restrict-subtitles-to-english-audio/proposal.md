## Why

The current subtitle policy enables English subtitles for any non-Spanish audio, including videos in languages other than English. The desired behavior is stricter: subtitles should turn on only for English-audio videos and should be disabled for all other videos.

## What Changes

- Change automatic subtitle activation to apply only when the active audio language is English, including regional variants such as `en-US` and `en_GB`.
- For English-audio videos, select a direct English subtitle track when one is available.
- Remove automatic English auto-translation fallback from subtitle activation.
- Disable subtitles for Spanish, non-English, and unknown audio-language videos.
- Preserve existing per-video manual override behavior and current-video confirmation semantics.

## Capabilities

### New Capabilities

### Modified Capabilities

- `audio-language-subtitle-policy`: restrict subtitle activation to confirmed English audio with a direct English subtitle track, and disable subtitles for all non-English or unknown audio.

## Impact

- Affected code: `src/shared/youtube-player-model.ts`, `src/features/audio-language-subtitle-policy/content.ts`, and related tests.
- Affected behavior: YouTube watch-page subtitle policy only; no new UI, permissions, dependencies, or background APIs.
