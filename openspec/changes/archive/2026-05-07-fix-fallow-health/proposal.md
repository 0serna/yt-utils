## Why

The unified repository check currently fails because `fallow --production-health` reports duplicated code and unresolved health violations in production extension code. This keeps the quality gate red and obscures new regressions behind a known backlog of structural debt.

## What Changes

- Refactor duplicated DOM-observer helper logic shared by the playback-speed and subscriptions-feed-controls content scripts into a reusable shared utility.
- Reduce targeted Fallow complexity findings in the main-world bridge and other flagged shared or feature modules without weakening thresholds or adding source-wide suppressions.
- Add or expand focused tests where needed so the refactors preserve existing behavior while making the reported functions simpler.
- Keep the repository quality gate strict so `npm run check` passes only when Fallow reports no remaining duplicate-code or configured health violations.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `developer-quality-gates`: Clarify that the repository check must stay green by resolving current Fallow duplication and complexity findings through tested refactors rather than suppressions or weaker limits.

## Impact

- Affected specs: `openspec/specs/developer-quality-gates/spec.md`
- Affected code likely includes `src/main-world/youtube-player-bridge.ts`, `src/shared/`, and the feature modules currently reported by Fallow.
- Affected tests include existing bridge coverage and any focused tests added to lock down behavior during refactors.
- No API, manifest, or dependency changes are expected.
