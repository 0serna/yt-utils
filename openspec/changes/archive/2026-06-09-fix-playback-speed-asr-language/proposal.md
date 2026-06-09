## Why

Some English YouTube videos report the active audio track as unknown (`und` / `Default`) while exposing many translated caption tracks, including Spanish. The playback-speed feature currently falls back to arbitrary caption-track language metadata, so it can misclassify English speech as Spanish and apply `1.10x`.

## What Changes

- Stop treating arbitrary caption-track availability as proof of the playback audio language.
- Keep active audio-track metadata authoritative when it reports English, Spanish, or another known language.
- When active audio language is unknown, allow only direct auto-generated caption tracks (`kind: "asr"` or ASR-style `vssId`) to infer English or Spanish for playback-speed initialization.
- Prefer English when unknown audio exposes both English ASR and Spanish ASR signals.
- Align the playback-speed contract to the intended English speed of `0.95x`.

## Capabilities

### New Capabilities

### Modified Capabilities

- `playback-speed`: refine language-aware speed initialization so unknown audio may use narrow ASR caption signals, but not arbitrary caption tracks, and English speed is `0.95x`.

## Impact

- Affects `src/features/playback-speed/content.ts` language selection logic.
- Affects playback-speed unit tests for English speed and caption fallback behavior.
- Updates the existing `playback-speed` OpenSpec requirement and scenarios.
