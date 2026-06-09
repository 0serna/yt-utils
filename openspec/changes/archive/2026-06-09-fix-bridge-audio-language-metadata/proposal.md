## Why

Some YouTube videos expose the active audio track with a top-level opaque `audioTrack.id` token while the actual language metadata lives under a newer `audioTrack.US` shape. The bridge currently accepts any non-`und` normalized ID as `audioLanguage`, so shared features can receive token-like values instead of a real language code and skip their intended language behavior.

## What Changes

- Recognize `audioTrack.US` as a current YouTube audio-track metadata shape.
- Ensure bridge `audioLanguage` is only a normalized language code or `null`, never an opaque YouTube token.
- Validate audio-track IDs with a simple BCP-style language-code check before accepting them.
- Keep audio-track name inference as a fallback when IDs are unusable but names identify English or Spanish.
- Preserve feature-specific caption fallbacks, such as playback-speed ASR fallback, by returning `null` when active audio metadata is unusable.

## Capabilities

### New Capabilities

### Modified Capabilities

- `audio-language-subtitle-policy`: active audio language inference must reject opaque audio-track IDs and recognize the `US` metadata shape.
- `playback-speed`: language-aware speed initialization must treat opaque active audio IDs as unknown so valid audio metadata or ASR fallback can drive speed.

## Impact

- Affects `src/main-world/youtube-player-bridge.ts` audio language inference.
- Affects `src/shared/youtube-player-model.ts` audio-track metadata typing.
- Affects bridge tests and any feature tests that depend on `PlayerSnapshot.audioLanguage`.
- No new user-facing UI, persistence format, or external dependency changes.
