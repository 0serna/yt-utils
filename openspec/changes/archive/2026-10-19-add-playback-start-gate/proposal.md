# Proposal

## Why

YouTube starts playback before the extension finishes its initial audio, subtitle, and playback-speed work. The viewer hears the audio track change and may see the speed change after playback has already started. A short fixed gate keeps the first playback on hold while those features do their first pass.

The chosen tradeoff is a fixed 3000 ms delay. It does not wait for feature completion and does not add a readiness contract.

## What Changes

- Add a new watch-page feature, `playback-start-gate`.
- On each Watch Session, hold the first playback for 3000 ms.
- If the main video is already playing when the feature activates, pause it and start the hold.
- If the video has not started yet, wait for the first `play` event, pause it, and start the hold.
- Resume only when the gate caused the pause, the 3000 ms elapsed, and the Watch Session is still current.
- Cancel the hold if the viewer starts playback during it. Never auto-play a video that was already paused.
- Skip ads and live streams.
- Register the feature before the playback-related features.
- Add unit tests for the gate state transitions.

No breaking changes.

## Capabilities

### New Capabilities

- `playback-start-gate`: fixed first-playback delay in a Watch Session so the initial audio, subtitle, and speed work does not start mid-playback.

### Modified Capabilities

None.

## Impact

- `src/content.ts`: register the new feature before the playback-related features.
- `src/features/playback-start-gate/content.ts`: new feature.
- `src/features/playback-start-gate/content.test.ts`: new tests.
- No manifest, bridge, background, or storage changes. The feature uses the page `<video>` element directly.
- User-visible cost: autoplay starts 3000 ms later on every Watch Session.
- Limit: if a playback feature takes longer than 3000 ms, the video starts before that feature finishes.
