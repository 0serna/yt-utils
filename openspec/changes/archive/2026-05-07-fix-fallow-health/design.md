## Context

`npm run check` currently fails because `fallow --production-health` reports one duplicate-code clone group and multiple complexity violations in production extension modules. The affected files span feature content scripts, shared DOM helpers, and the main-world YouTube player bridge, so the work crosses module boundaries but does not require new architecture, dependencies, or user-facing feature changes.

The existing OpenSpec quality-gate rules already establish that Fallow should fail on real findings and that debt reduction should happen through refactors instead of suppressions. This change turns that expectation into an implementation-ready plan for the current backlog of Fallow findings.

## Goals / Non-Goals

**Goals:**

- Remove the currently reported duplicate-code clone group with a reusable shared helper.
- Reduce targeted Fallow complexity findings until `fallow --production-health` passes under the existing strict gate.
- Preserve current runtime behavior while simplifying flagged functions.
- Add focused tests where needed so sensitive refactors, especially around the YouTube player bridge, remain behaviorally stable.

**Non-Goals:**

- Changing extension features, UX, or product behavior beyond behavior-preserving refactors.
- Weakening Fallow thresholds, adding broad ignores, or introducing inline suppressions as the primary solution.
- Rewriting unrelated modules that are not needed to clear the reported Fallow findings.

## Decisions

### Resolve duplication with a shared DOM utility

The duplicated logic in `playback-speed` and `subscriptions-feed-controls` is the same class of DOM observation plumbing: identifying relevant external nodes, matching selectors, and coalescing reinjection work. A shared helper in `src/shared/` is preferred over parallel local rewrites because it removes the clone group directly and leaves later feature maintenance with one place to adjust this behavior.

Alternative considered:

- Keep each feature local and restructure them differently. Rejected because it makes the Fallow fix less direct and risks leaving semantically identical observer logic duplicated in slightly different forms.

### Treat `youtube-player-bridge.ts` as the first complexity target

Fallow identifies the bridge as the highest-priority refactoring target, and the file concentrates several data-extraction branches that can be decomposed into smaller helpers without changing the bridge contract. The implementation should simplify extraction, normalization, and inference logic in that file before addressing lower-risk complexity findings elsewhere.

Alternative considered:

- Start with easy shared helpers first and defer the bridge. Rejected because the bridge is the highest-value complexity reducer and already has dedicated behavior tests that lower refactor risk.

### Preserve behavior with targeted tests

This change is a structural refactor, not a feature redesign. Existing tests should remain the authority for preserved behavior, and targeted tests may be added where a flagged function has fragile branching or ambiguous inputs. The bridge's existing test file makes it a suitable place to extend behavior coverage before or alongside simplification.

Alternative considered:

- Refactor only and rely on current tests. Rejected because the highest-risk functions interact with YouTube player state and message boundaries that benefit from explicit behavioral lock-in.

### Address remaining flagged modules incrementally after each Fallow rerun

Because Fallow reports multiple functions across shared and feature modules, the work should proceed in small batches: refactor one target area, rerun `fallow --production-health`, and use the updated output to choose the next file. This keeps scope grounded in the tool's live findings and avoids broad speculative rewrites.

Alternative considered:

- Plan all flagged functions up front and refactor them in one sweep. Rejected because the list may shrink after early changes and would create unnecessary coupling between otherwise independent refactors.

## Risks / Trade-offs

- [Shared helper becomes too feature-specific] -> Keep the extracted utility limited to generic DOM matching or observation concerns and leave feature semantics in their own modules.
- [Behavior drift during bridge simplification] -> Extend behavior tests around snapshot reading and subtitle selection before or during the refactor.
- [Complexity is redistributed instead of reduced] -> Rerun Fallow after each batch and prefer small, named helpers that lower per-function branching rather than moving large conditionals unchanged.
- [Green requires more files than initial estimates] -> Accept incremental transversal refactors across shared and feature modules while keeping each change behavior-preserving and test-backed.

## Migration Plan

No deployment or data migration is required. The change ships as source refactors plus test updates.

Validation depends on the normal repository gates:

- `fallow --production-health`
- `npm test`
- `npm run check`

Rollback is straightforward because the work does not alter stored data or public interfaces; reverting the refactor commit restores the prior source layout and quality-gate state.

## Open Questions

- None. The change direction is settled: green Fallow through tested refactors, shared helper extraction where duplication is real, and no threshold weakening.
