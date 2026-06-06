## Why

Some YouTube videos expose the active audio track as unknown (`und` / `Default`) while also exposing an English auto-generated caption track for the same audio. The current subtitle policy treats that state as unknown audio and leaves captions off, so English videos like the observed Fitbit video do not get subtitles activated.

## What Changes

- Treat an English auto-generated caption track as a strong fallback signal for English audio only when the active audio language is missing or unusable.
- Keep non-English active audio authoritative: do not activate English captions when the player reports Spanish or another non-English language.
- Do not infer English audio from arbitrary manual English caption tracks when active audio is unknown.
- Preserve the existing direct English subtitle selection behavior once a video is classified as English-audio content.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `audio-language-subtitle-policy`: unknown active audio may be treated as English-audio content only when supported by a direct English auto-generated caption track.

## Impact

- Affects subtitle selection policy in `src/shared/youtube-player-model.ts` and related tests.
- No new APIs, dependencies, UI, or storage changes.
- Updates the existing OpenSpec capability for audio-language subtitle policy.
