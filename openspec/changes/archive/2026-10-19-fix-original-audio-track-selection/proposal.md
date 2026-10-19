# Proposal

## Why

On real YouTube multi-audio videos, every available track can report `isAutoDubbed: false`, and the active dubbed track can report `isDefault: true`. `original-audio-track` selects the first track with `isAutoDubbed === false`, so it keeps the dubbed track and never switches to the Original Audio Track.

A manual test on a paused video confirmed that `setAudioTrack` changes to the English original correctly. The playback gate is not the blocker; selection is.

## What Changes

- Identify the Original Audio Track from the track content encoded in its id (`original` vs `dubbed`) before using metadata flags.
- If the id has no usable content, use a track name that marks the track as original.
- Keep `isAutoDubbed: false` and `isDefault: true` as fallbacks, with `isDefault` last because it can describe the active track.
- Keep one application per Watch Session and the existing retry, announcement, and failure behavior.
- Add regression tests with the real shape: all tracks report `isAutoDubbed: false`, the active dubbed track reports `isDefault: true`, and the original track reports `isDefault: false` with a name such as `English original`.
- No API, storage, bridge, or manifest changes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `original-audio-track`: the rule that identifies which available track is the Original Audio Track when metadata flags are unreliable or contradictory.

## Impact

- `src/shared/youtube-player-model.ts`: selection and track-content parsing.
- `src/shared/youtube-player-model.test.ts`: regression coverage.
- `src/features/original-audio-track/content.test.ts`: fixture adjustment if needed.
- `openspec/specs/original-audio-track/spec.md`: updated at archive time.
- User-visible: videos with auto-dubbed audio switch to the creator's original track again.
