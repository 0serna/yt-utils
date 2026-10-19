# Tasks

## 1. Track content parsing and selection

- [x] 1.1 Add a helper in `src/shared/youtube-player-model.ts` that reads the last `;` segment of an audio-track id, base64-decodes it with `atob`, and returns `original`, `dubbed`, or `null`; verify `npm run typecheck` passes.
- [x] 1.2 Update `selectOriginalAudioTrack` to prefer the `original` content, then an original-like name, then `isAutoDubbed: false` excluding `dubbed` content, then `isDefault: true`; verify `npm run typecheck` passes.
- [x] 1.3 Add model tests with the real ids `251;ChEKBWFjb250EghvcmlnaW5hbAoKCgRsYW5nEgJlbg` (original) and `251;Cg8KBWFjb250EgZkdWJiZWQKCgoEbGFuZxICYXI` (dubbed), including all flags false and the active dubbed track marked default; verify `npx vitest run src/shared/youtube-player-model.test.ts` passes.
- [x] 1.4 Add fallback tests for an invalid id, an original-like name, a non-original name with `isAutoDubbed: true`, and no identifiable original; verify `npx vitest run src/shared/youtube-player-model.test.ts` passes.
- [x] 1.5 Run the existing original-audio-track feature tests and adjust fixtures only if the selector change requires it; verify `npx vitest run src/features/original-audio-track/content.test.ts` passes.

## 2. Integration checks

- [x] 2.1 Run `npm run check`, `npm run typecheck`, `npm test`, and `npm run build`; verify all four commands exit 0.
- [x] 2.2 Reload the extension and open the real dubbed video `plN7JMbadRg`; verify the active audio changes from the Arabic dubbed track to `English original` and stays on the original after the gate resumes.
- [x] 2.3 Return to `add-playback-start-gate` and complete its tasks 2.3 and 2.4 with this fix in place; verify the original audio applies while the video is paused and update that change's tasks.

## Workflow follow-up

- Apply this change before resuming `add-playback-start-gate`.
- After review, run `/openspec-archive-change` and sync the delta specs.
