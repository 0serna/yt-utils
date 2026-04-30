## Why

Fallow currently needs explicit Chrome extension entry points to distinguish live extension modules from dead code. Without that configuration, quality gates either report false positives or require broad suppressions that hide real unused exports and duplication.

## What Changes

- Configure Fallow with the repository's real runtime entry points from `manifest.json`.
- Keep `fallow --fail-on-issues` as part of the unified `check` script without global source-wide duplicate suppression.
- Remove unused exports and unused type exports that Fallow identifies after entry point detection is corrected.
- Establish explicit health thresholds so complexity gates represent accepted project limits rather than accidental defaults.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `developer-quality-gates`: Require Fallow to run against correct extension entry points and fail on real issues as part of repository checks.

## Impact

- Affects Fallow configuration, unused exports/types in source files, and the `check` quality gate behavior.
- Does not change extension runtime behavior intentionally.
- This change is the first item in a dependent cleanup series; duplicate-code failures are expected to remain until subsequent changes remove the duplication.
