## 1. Update automation flow

- [x] 1.1 Add `video.play()` call after seeking to 99% in `src/features/mark-as-seen/automation.ts`
- [x] 1.2 Add a ~2 second wait after `video.play()` to allow the heartbeat to fire
- [x] 1.3 Keep the existing `video.pause()` call after the playback wait
- [x] 1.4 Verify the seek-verification block still passes before the new playback step

## 2. Test and validate

- [x] 2.2 Test on a long video (>3 min) to confirm the red progress bar appears
- [x] 2.3 Test on a short video (<30s) to confirm the automation still completes
- [x] 2.4 Verify the inline button shows success state after the fix
