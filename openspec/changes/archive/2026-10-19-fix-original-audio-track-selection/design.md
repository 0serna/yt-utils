# Design

## Context

`summarizeAvailableAudioTrack` builds the list that `selectOriginalAudioTrack` receives. The summarized track keeps `id`, `name`, `isDefault`, and `isAutoDubbed`, but drops the raw track object.

Real YouTube track ids encode the content type. For example:
- `251;Cg8KBWFjb250EgZkdWJiZWQKCgoEbGFuZxICYXI` decodes to a track whose content is `dubbed` and language is `ar`.
- `251;ChEKBWFjb250EghvcmlnaW5hbAoKCgRsYW5nEgJlbg` decodes to a track whose content is `original` and language is `en`.

The flags are not reliable. On a real multi-audio video, all tracks reported `isAutoDubbed: false`, and the active dubbed track reported `isDefault: true`.

See `proposal.md` for the motivation.

## Goals / Non-Goals

**Goals:**
- Select the Original Audio Track from the content encoded in its id when that signal exists.
- Fall back to an original-like name, then to the existing flags.
- Keep the current feature lifecycle, retry limit, announcement, and failure behavior.
- Cover the real track shape with regression tests.

**Non-Goals:**
- Change the bridge, the content script, or the audio-switch announcement.
- Add storage, manifest, or permission changes.
- Guarantee identification when YouTube removes every signal.

## Decisions

### Parse content from the id

Add a helper that splits the track id on `;`, base64-decodes the last segment with `atob`, and looks for the `original` or `dubbed` content word. Invalid ids return `null`. The helper works on the summarized `AvailableAudioTrack.id`, so no new field is needed.

Alternative: add a `content` field to `AvailableAudioTrack`. Rejected because it widens a shared type and forces every fixture to change for a value that is already present in `id`.

### Prefer content, then name, then flags

Selection order:
1. A track whose id content is `original`.
2. A track whose name contains `original`.
3. A track with `isAutoDubbed: false`, excluding tracks whose id content is `dubbed`.
4. A track with `isDefault: true`.

The active track's `isDefault` flag cannot win over an explicit original signal. The existing fallbacks remain for videos that do not expose the new signals.

Alternative: use `isDefault` first. Rejected because a real active dubbed track reported `isDefault: true`.

### Keep the selector signature

`selectOriginalAudioTrack(tracks: AvailableAudioTrack[])` keeps its signature. The feature continues to apply the selected track through `applyAudioTrackSelection`. No changes are needed in `original-audio-track/content.ts`.

### Test with real ids

Use the observed ids in the model tests. One test covers all tracks reporting `isAutoDubbed: false`, the active dubbed track reporting `isDefault: true`, and the original track reporting `isDefault: false`. Another covers the id content without a usable name. Existing flag-based tests remain.

## Risks / Trade-offs

- **The id format changes** -> The name and flag fallbacks still work. Add a new signal only when a real failure is observed.
- **Base64 decoding fails** -> The helper catches the error and returns `null`; selection falls back to name and flags.
- **A localized name does not contain “original”** -> The id is checked first. The name is only a fallback.
- **A track id contains the word `original` for another reason** -> The content is read from the last id segment and matched as a word. Keep the test ids from real data.
- **The selected track cannot be applied** -> Existing retry, give-up, and announcement behavior remains unchanged.

## Migration Plan

No data migration. Deploy the selector change with the model tests. Rollback is reverting the selector and tests.
