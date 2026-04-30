## 1. Baseline

- [x] 1.1 Run `npx fallow --fail-on-issues --format compact` and capture the current health findings grouped by file
- [x] 1.2 Run `npm run test -- --run` to establish the current characterization baseline
- [x] 1.3 Identify which findings are best reduced by coverage and which require refactoring

## 2. Highest-Risk Feature Refactors

- [x] 2.1 Add or update characterization coverage for `src/features/ask-auto-open/content.ts`
- [x] 2.2 Refactor `syncAskPanel` to reduce cyclomatic and cognitive complexity while preserving ask-panel behavior
- [x] 2.3 Add or update characterization coverage for `src/features/audio-language-subtitle-policy/content.ts`
- [x] 2.4 Refactor `syncPolicy` to reduce cyclomatic and cognitive complexity while preserving subtitle-off behavior

## 3. Mark-As-Seen Findings

- [x] 3.1 Add or update characterization coverage for `src/features/mark-as-seen/background.ts`, `src/features/mark-as-seen/automation.ts`, `src/features/mark-as-seen/content-automation.ts`, and `src/features/mark-as-seen/content.ts`
- [x] 3.2 Refactor mark-as-seen background and automation findings without changing tab, inline button, or injected automation behavior
- [x] 3.3 Run focused mark-as-seen tests and confirm Fallow findings for the cluster are reduced

## 4. Shared Helper Findings

- [x] 4.1 Add or update characterization coverage for `src/shared/youtube-dom.ts`, `src/shared/youtube-player.ts`, `src/shared/messaging.ts`, `src/shared/feature-registry.ts`, and `src/shared/extension-button.ts` as needed
- [x] 4.2 Refactor shared helper findings while preserving public helper behavior and message payload contracts
- [x] 4.3 Run focused shared-helper tests and confirm Fallow findings for the cluster are reduced

## 5. Remaining Feature Findings

- [x] 5.1 Add or update coverage for `playback-speed`, `subscriptions-hide`, `subscriptions-seen-overlay`, `auto-switch-to-videos-tab`, `engagement-panel-scroll-containment`, and `global-selection-search` findings as needed
- [x] 5.2 Refactor remaining feature findings that cannot be resolved by coverage alone
- [x] 5.3 Run focused feature tests and confirm all remaining Fallow health findings are resolved

## 6. Verification

- [x] 6.1 Run `npm run test -- --run` and confirm all tests pass
- [x] 6.2 Run `npm run build` and confirm the extension build succeeds
- [x] 6.3 Run `npm run check` and confirm it passes end-to-end with Fallow health enabled
- [x] 6.4 Run `openspec validate reduce-fallow-health-debt --strict`
