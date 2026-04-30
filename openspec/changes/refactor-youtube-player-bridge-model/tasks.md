## 1. Preconditions

- [ ] 1.1 Confirm `add-vitest-characterization-tests` has been implemented or equivalent model/bridge characterization coverage exists
- [ ] 1.2 Run the model and bridge tests to establish the pre-refactor behavior baseline
- [ ] 1.3 Capture current Fallow health findings for `src/main-world/youtube-player-bridge.ts` and `src/shared/youtube-player-model.ts`

## 2. Bridge Refactor

- [ ] 2.1 Refactor bridge message handling to reduce branch concentration while preserving request and response payload behavior
- [ ] 2.2 Refactor player snapshot construction to separate fallback reads from snapshot assembly without changing snapshot shape
- [ ] 2.3 Refactor audio-language inference to reduce repeated branching while preserving existing fallback order
- [ ] 2.4 Refactor video ID and caption-track reads where doing so reduces Fallow findings without exposing internals solely for tests

## 3. Model Helper Refactor

- [ ] 3.1 Refactor caption-track signature construction to reduce complexity while preserving generated signatures
- [ ] 3.2 Refactor audio-track signature construction to reduce complexity while preserving generated signatures

## 4. Verification

- [ ] 4.1 Run `npm run test` and confirm characterization tests still pass
- [ ] 4.2 Run `npm run build` and confirm extension build still succeeds
- [ ] 4.3 Run `npm run check` diagnostically and confirm targeted Fallow findings are reduced without suppressions or threshold increases
- [ ] 4.4 Run `openspec validate refactor-youtube-player-bridge-model --strict`
