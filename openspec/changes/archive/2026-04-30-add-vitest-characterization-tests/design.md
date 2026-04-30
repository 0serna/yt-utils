## Context

The repository is a Chrome MV3 extension with TypeScript source, Vite build tooling, path aliases, and no existing automated test suite. `npm run check` currently fails at Fallow health analysis because complex untested functions produce high CRAP scores. The intended direction is to add tests before refactoring so behavior is protected and debt remains visible.

## Goals / Non-Goals

**Goals:**

- Add a minimal Vitest test setup that works with TypeScript, ESM, repository path aliases, and DOM-dependent extension code.
- Generate Istanbul coverage from `npm run test` without enforcing coverage thresholds.
- Add colocated characterization tests for `youtube-player-model` and `youtube-player-bridge` behavior.
- Preserve current runtime behavior and avoid refactoring production code as part of the test introduction.

**Non-Goals:**

- Making `npm run check` green in this change.
- Adding coverage percentage gates.
- Refactoring high-complexity functions.
- Exporting internal bridge helpers solely for tests.
- Suppressing Fallow health findings or weakening Fallow thresholds.

## Decisions

- Use Vitest rather than Jest or Node's built-in test runner because the project already uses Vite, TypeScript, ESM, and path aliases that Vitest can support with less integration work.
- Use `jsdom` as the default test environment because the first coverage target includes MAIN-world bridge code that depends on `window`, `document`, `HTMLElement`, `postMessage`, and `#movie_player`.
- Configure Istanbul coverage generation without minimum thresholds. This keeps coverage informative for Fallow and refactoring decisions without introducing a new percentage-based gate.
- Keep tests separate from `npm run check` initially. The existing check command remains the visible quality gate, and known Fallow health failures should not be hidden while coverage and refactors are built up.
- Colocate tests beside the modules under test using `*.test.ts` files. This keeps characterization tests close to the code they protect during subsequent refactors.
- Prefer black-box bridge tests over exporting internals. Bridge behavior should be tested through observable messages and fake YouTube player DOM rather than by changing module APIs before refactoring.
- Use explicit Vitest imports (`describe`, `it`, `expect`, `vi`) rather than test globals to minimize global configuration and keep TypeScript behavior obvious.

## Risks / Trade-offs

- `npm run check` remains red after this change → Accept temporarily and report that remaining failures are known Fallow health debt.
- Bridge tests may be sensitive to global browser state → Reset DOM, module state, and event listeners between characterization cases.
- Coverage may not automatically affect Fallow unless Fallow is invoked with the generated coverage file → Treat coverage integration as a follow-up verification detail, not a reason to weaken thresholds.
- Black-box tests can be more verbose than direct helper tests → Preserve this cost to avoid test-only API changes before refactoring.

## Migration Plan

- Add development-only test dependencies and configuration.
- Add `npm run test` as the single initial test command.
- Ensure `npm run test` produces Istanbul coverage without threshold enforcement.
- Add initial model and bridge characterization tests.
- Verify with `npm run test`, `npm run build`, and diagnostic `npm run check` output.

## Open Questions

- None.
