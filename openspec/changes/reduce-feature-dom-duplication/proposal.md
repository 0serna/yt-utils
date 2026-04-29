## Why

Multiple YouTube feature content scripts duplicate DOM synchronization mechanics such as polling, mutation observation, animation-frame queueing, and watch action insertion. This duplication makes future feature fixes harder and prevents Fallow duplicate-code gates from becoming a meaningful strict check.

## What Changes

- Extract a minimal shared DOM synchronization controller for feature content scripts that react to YouTube DOM changes.
- Extract shared watch action insertion helpers for controls injected into the YouTube watch action row.
- Update duplicated feature implementations to use the shared helpers while preserving runtime behavior.
- Keep the abstraction narrow so it does not become a general feature framework.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `project-structure`: Clarify that repeated cross-feature DOM orchestration and watch action insertion patterns belong in shared utilities.

## Impact

- Affects feature content scripts that currently duplicate DOM lifecycle or insertion logic, especially ask auto-open, engagement panel scroll containment, mark-as-seen, and playback speed controls.
- Reduces duplicate code reported by Fallow without intentionally changing user-visible behavior.
- Requires browser validation on YouTube watch pages because the affected code coordinates dynamic DOM changes.
