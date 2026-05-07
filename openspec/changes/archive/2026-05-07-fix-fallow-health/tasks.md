## 1. Baseline and duplicate-code reduction

- [x] 1.1 Capture the current `fallow --production-health` findings and confirm the active duplicate-code clone group and complexity targets to eliminate.
- [x] 1.2 Extract the duplicated DOM observation or selector-matching logic used by `src/features/playback-speed/content.ts` and `src/features/subscriptions-feed-controls/content.ts` into a shared reusable utility.
- [x] 1.3 Update both affected feature modules to use the shared utility while preserving their current behavior and rerun Fallow to confirm the clone group is removed.

## 2. Bridge complexity refactor

- [x] 2.1 Extend `src/main-world/youtube-player-bridge.test.ts` with any focused behavior coverage needed to lock down snapshot reading and subtitle-selection behavior before simplifying complex branches.
- [x] 2.2 Refactor `src/main-world/youtube-player-bridge.ts` into smaller helpers that reduce the reported complexity of snapshot extraction, language inference, and related bridge logic without changing the bridge contract.
- [x] 2.3 Rerun Fallow and tests to confirm the bridge findings are reduced and the refactor preserves behavior.

## 3. Remaining Fallow health cleanup

- [x] 3.1 Refactor the next highest-priority shared modules still reported by Fallow, keeping each change behavior-preserving and reducing per-function branching rather than moving it unchanged.
- [x] 3.2 Refactor any remaining flagged feature modules still needed to clear Fallow health findings, adding focused tests only where behavior needs stronger lock-in.
- [x] 3.3 Rerun `fallow --production-health` after each batch until no duplicate-code or configured health violations remain.

## 4. Final validation

- [x] 4.1 Run `npm test` and fix any regressions introduced by the refactors.
- [x] 4.2 Run `npm run check` and confirm the repository quality gate passes with Fallow in green under the existing strict configuration.
