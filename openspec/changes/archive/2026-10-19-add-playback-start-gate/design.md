# Design

## Context

`FeatureRegistry` activates watch features synchronously. The audio, subtitle, and speed features start asynchronous polling with `void` and expose no completion signal. The content script runs at `document_idle`, so the main video may already be playing, or it may start later.

See `proposal.md` for the motivation and the fixed-delay tradeoff.

## Goals / Non-Goals

**Goals:**
- Hold the first playback of each Watch Session for 3000 ms.
- Catch both an already-playing video and a late autoplay.
- Resume only when the gate caused the pause.
- Clean up on navigation, deactivation, and viewer play.
- Skip ads and live streams.

**Non-Goals:**
- Wait for feature completion. The gate releases after 3000 ms even if work remains.
- Change the `Feature` contract or the registry.
- Fix the audio-to-speed ordering.
- Add pause or play actions to the MAIN-world bridge.
- Affect non-watch pages, Shorts, or the mini player.

## Decisions

### Standalone watch feature

Add `src/features/playback-start-gate/content.ts` and register it before the playback-related features. Keep `FeatureRegistry` generic. The feature owns its timer, listeners, and state, and cleans them in `deactivate()`.

Alternative: pause inside the registry. Rejected because playback policy does not belong in the lifecycle registry.

### Trigger on the first `play` event

Listen for `play` events on the document with capture. When the main video starts, pause it in the handler and start the 3000 ms timer. This catches autoplay that starts after activation, which a timer started at activation would miss.

Alternative: pause only if the video is already playing at activation. Rejected because it misses late autoplay.

### Fixed 3000 ms timer

Hold for 3000 ms measured from the pause. If `video.duration` is unknown, wait up to 1000 ms for metadata and hold the remaining time. If the video is live, resume immediately. Do not read feature state and do not add a readiness API.

Alternative: per-feature readiness signals. Rejected for this change. It adds a contract to every watch feature and more failure handling.

### Use the `<video>` element directly

Call `video.pause()` and `video.play()` from the content script. The bridge only exposes player API reads and audio/subtitle writes, and pause/play do not need it. The player receives the same DOM events and keeps its UI in sync.

Alternative: add `pause` and `play` bridge actions. Rejected because it adds message round trips and a new action shape for no behavior gain.

### Cancel on the next play attempt or deactivation

The first `play` event starts the hold. A second `play` event during the hold means the viewer or the player wants playback, so the gate cancels and does not pause again. `deactivate()` clears the timer and listener without resuming.

A `resuming` flag prevents the gate's own `video.play()` from being treated as a new play attempt. The flag stays set until the play promise settles.

### Skip ads and live streams

If `#movie_player` has `ad-showing`, do not hold. Treat a video as live when `video.duration` is infinity or `.ytp-live-badge` is visible. A non-finite duration is not a live signal: metadata may not be loaded yet. Pause first, wait up to 1000 ms for metadata, then hold the remaining time for VOD or resume immediately for live.

### Main video only

Resolve the target as `#movie_player video`, then fall back to the first `video` element. Ignore play events from other video elements.

## Risks / Trade-offs

- **3000 ms is not enough** -> Accepted. The spec records that the gate releases even when features are still working. The viewer may still hear a late audio change.
- **Resume can be rejected by autoplay policy** -> Catch the play promise rejection, leave the video paused, and log a diagnostic. The viewer can press play.
- **`setAudioTrack` may not apply while paused** -> Verify manually on a real watch page during implementation. If it fails, the gate still holds playback but does not achieve the audio goal.
- **Short audio blip before the pause** -> Pause synchronously in the `play` handler. The first event fires before sustained playback, so the blip should be minimal.
- **Ad or live detection is heuristic** -> Use `ad-showing`, an infinite duration, and a visible `.ytp-live-badge`. If a live stream has a finite DVR window, it can receive the 3000 ms hold.
- **Duration is unknown at the first play** -> Pause first and wait up to 1000 ms for metadata before deciding. Do not treat `NaN` as live.
- **Video element replacement inside a Watch Session** -> Use a document-level capture listener instead of a listener bound to one element.
- **User presses play during the hold** -> The second `play` event cancels the hold immediately.

## Migration Plan

Register the feature in `src/content.ts`; no storage or manifest migration. Rollback is removing the registration. The feature has no persistent state.
