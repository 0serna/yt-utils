## Why

`npm run check` currently fails on Fallow health findings, and the repository has no automated tests or coverage report to distinguish risky untested complexity from behavior that is already protected. Adding characterization tests first creates a safety net for reducing the visible debt without suppressing Fallow findings or weakening thresholds.

## What Changes

- Add a Vitest-based test capability for TypeScript source files.
- Configure tests to run in a `jsdom` environment so YouTube DOM and MAIN-world bridge behavior can be exercised.
- Generate Istanbul coverage from `npm run test` without enforcing minimum coverage percentages.
- Add initial black-box characterization tests for `src/shared/youtube-player-model.ts` and `src/main-world/youtube-player-bridge.ts`.
- Keep tests separate from `npm run check` initially; `npm run check` may remain red on known Fallow health debt until coverage and refactors reduce the findings.
- Do not add Fallow suppressions, raise Fallow health thresholds, or export internal helpers solely for testing.

## Capabilities

### New Capabilities

- `test-automation`: Defines repository test automation, coverage generation, and initial characterization-test expectations.

### Modified Capabilities

- `developer-quality-gates`: Clarify that the initial test command is separate from the unified check command while Fallow health debt remains visible.

## Impact

- Affects `package.json`, lockfile dependencies, test configuration, and initial colocated `*.test.ts` files.
- Adds development-only dependencies for Vitest, jsdom, and Istanbul coverage support.
- Does not intentionally change extension runtime behavior.
- Provides coverage and behavior characterization to support later refactoring of player model and bridge code.
