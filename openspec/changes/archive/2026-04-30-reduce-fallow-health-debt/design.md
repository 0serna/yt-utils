## Context

The repository check command currently fails at Fallow health with 33 functions above threshold. The largest findings are concentrated in `syncAskPanel`, `syncPolicy`, mark-as-seen automation/background handlers, shared YouTube DOM helpers, playback-speed state sync, messaging normalization, and several feature content scripts.

Recent work reduced Fallow findings in the YouTube player bridge/model area and archived the related change. This change extends the same approach across the remaining reported health debt so the configured quality gate can become green without weakening the gate.

## Goals / Non-Goals

**Goals:**

- Make `npm run check` pass with Fallow health enabled.
- Reduce all currently reported Fallow health findings through behavior-preserving tests and refactors.
- Preserve extension runtime behavior, message payloads, YouTube DOM side effects, and user-visible behavior.
- Keep Fallow thresholds and ignore configuration unchanged.
- Leave remaining code readable rather than replacing simple branch logic with clever abstractions.

**Non-Goals:**

- Adding new product features or changing YouTube behavior.
- Reworking the extension architecture broadly.
- Suppressing Fallow findings with inline comments or broad configuration ignores.
- Raising health thresholds or disabling failure behavior.

## Decisions

- Treat Fallow output as the implementation backlog. Capture the current compact health output first, then work file-by-file until no health findings remain.
- Prefer tests first where CRAP is driven by missing coverage and the function's branch structure is otherwise acceptable.
- Prefer refactor first for functions with very high cyclomatic or cognitive complexity, especially `syncAskPanel`, `syncPolicy`, and larger DOM orchestration functions.
- Keep refactors local to the reported module unless an existing shared helper clearly fits the code. Avoid extracting new shared abstractions solely to satisfy a metric.
- Run focused tests after each cluster, then run `npm run check` diagnostically to confirm the finding count decreases.

## Risks / Trade-offs

- Refactoring DOM-heavy YouTube code can change timing or side effects -> add characterization tests around observable behavior before restructuring high-risk functions.
- Reducing every health finding in one change may touch many modules -> work in small clusters and keep each edit behavior-preserving.
- Coverage-only fixes can make tests brittle if they assert implementation details -> prefer black-box behavior tests and avoid exporting internals just for tests.
- Fallow may report new or shifted findings after refactors -> use final `npm run check` as the source of truth and avoid weakening thresholds.

## Migration Plan

- No runtime migration is required.
- Implement and verify in clusters: capture baseline, add/adjust tests, refactor targeted functions, rerun tests/checks, and repeat until Fallow health is green.
- If a cluster exposes unclear behavior, pause and clarify rather than guessing or changing product behavior.

## Open Questions

- None.
