## Why

The "mark as seen" feature intermittently fails to mark videos as watched — the red progress bar on thumbnails does not always appear after the automation runs. Investigation reveals that YouTube's server-side watch tracking requires a `heartbeat` signal that only fires during actual video playback, not during programmatic seeks. The current automation seeks to 99% and pauses without ever playing, so the heartbeat never fires and YouTube never registers the video as watched.

## What Changes

- The automation will briefly play the video (1–2 seconds) after seeking to 99% before pausing, triggering YouTube's heartbeat signal.
- The automation will wait for the heartbeat to fire (up to ~3 seconds) before proceeding to the share dialog flow.
- The existing seek → pause → share → redirect sequence remains unchanged; only a brief playback step is inserted between seek and pause.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `youtube-watch-marking-extension`: The automation flow requirement changes from "seek to 99% then pause" to "seek to 99%, play briefly, then pause" to ensure YouTube's heartbeat fires and the video is reliably marked as watched.

## Impact

- `src/features/mark-as-seen/automation.ts`: The `runYoutubeMarkAsSeenAutomation` function needs a short playback step inserted after seeking.
- Total automation time increases by ~2–3 seconds per video.
- No changes to user-facing UI, messaging, or the share/redirect flow.
