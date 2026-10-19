# Tasks

## 1. Playback gate feature

- [x] 1.1 Create `src/features/playback-start-gate/content.ts` with the watch-page feature, module state, document-level `play` listener, 3000 ms timer, and full cleanup in `deactivate()`; verify `npm run typecheck` passes.
- [x] 1.2 Implement the hold rules: pause the main video on the first play, resume only after the gate pause, cancel on a second play, skip ads, skip live streams, and keep the `resuming` flag until the play promise settles; verify the behavior with the tests from task 1.3.
- [x] 1.3 Add `src/features/playback-start-gate/content.test.ts` covering already-playing activation, late first play, viewer play during the hold, deactivation cleanup, ad skip, and live-stream skip; verify `npx vitest run src/features/playback-start-gate/content.test.ts` passes.
- [x] 1.4 Register `playbackStartGateFeature` in `src/content.ts` before the playback-related features; verify `npm run typecheck` passes and the registration order is visible in the file.

## 2. Integration checks

- [x] 2.1 Run `npm run check`, `npm run typecheck`, `npm test`, and `npm run build`; verify all four commands exit 0.
- [x] 2.2 After a manual extension reload, open a watch page and verify the video pauses for about 3000 ms and then resumes; verify a second play during the hold cancels it immediately.
- [x] 2.3 Verify on a real dubbed video that the original audio track applies while the video is paused by the gate. If it does not apply until playback resumes, record the failure and revisit the design before archiving.
- [x] 2.4 Verify an ad and a live stream are not paused by the gate, and verify navigation to another video during the hold does not resume the previous video. The live stream and navigation checks passed manually; the ad branch is covered by the unit test because no real ad was available.

## 3. Fix unknown-duration playback

- [x] 3.1 Pause before deciding live status, wait up to 1000 ms for metadata, detect live with an infinite duration or a visible `.ytp-live-badge`, and hold the remaining 3000 ms; verify `npm run typecheck` passes.
- [x] 3.2 Add tests for unknown duration with `loadedmetadata` and a visible live badge; verify `npx vitest run src/features/playback-start-gate/content.test.ts` passes with 12 tests.
- [x] 3.3 Run `npm run check`, `npm run typecheck`, `npm test`, and `npm run build`; verify all four commands exit 0 (300 tests).
- [x] 3.4 Reload the extension, refresh the YouTube tab, and verify a VOD pauses about 3000 ms while a live stream does not; update this task with the result.

## Workflow follow-up

- Run `/openspec-apply-change` to implement this change.
- After review, run `/openspec-archive-change` and sync the delta specs.
