## Why

`npm run check` fails because Fallow health reports 33 functions above configured thresholds. The repository already requires Fallow to block real quality issues, so the debt should be reduced through focused tests and refactors rather than suppressions or weaker limits.

## What Changes

- Reduce Fallow health findings enough for `npm run check` to pass.
- Prioritize the highest-risk complexity and CRAP findings in `ask-auto-open`, `audio-language-subtitle-policy`, `mark-as-seen`, shared YouTube helpers, messaging, and related feature modules.
- Add or extend characterization tests where CRAP is driven by missing coverage.
- Refactor high-complexity functions where coverage alone would not address cyclomatic or cognitive thresholds.
- Do not add `fallow-ignore` suppressions, broaden ignores, or raise Fallow thresholds.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `developer-quality-gates`: The repository check command should pass with Fallow health findings resolved through tests and code simplification.

## Impact

- Affects quality-gate-sensitive modules reported by Fallow health, likely including `src/features/ask-auto-open/content.ts`, `src/features/audio-language-subtitle-policy/content.ts`, `src/features/mark-as-seen/*`, `src/shared/youtube-dom.ts`, `src/features/playback-speed/content.ts`, `src/shared/youtube-player.ts`, `src/shared/messaging.ts`, and smaller feature modules.
- Adds or updates Vitest coverage where behavior characterization is needed before refactoring.
- Does not intentionally change extension runtime behavior, user-visible YouTube behavior, public message contracts, dependencies, or Fallow threshold configuration.
