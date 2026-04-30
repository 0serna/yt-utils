## Why

Fallow health identifies `src/main-world/youtube-player-bridge.ts` and related player model helpers as concentrated complexity hotspots. After characterization tests are in place, these modules can be refactored to reduce real complexity while preserving bridge behavior and keeping Fallow debt visible.

## What Changes

- Refactor `youtube-player-bridge` to reduce cyclomatic, cognitive, and CRAP findings without changing externally observable bridge behavior.
- Refactor related `youtube-player-model` helper logic where doing so reduces complexity or improves test-supported clarity.
- Keep the MAIN-world bridge message contract unchanged.
- Preserve the current subtitle-off policy behavior and snapshot shape.
- Do not use Fallow suppressions, raise Fallow health thresholds, or introduce compatibility shims without a concrete need.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `audio-language-subtitle-policy`: Preserve existing player snapshot and subtitle-selection behavior while simplifying the bridge/model implementation that supports it.
- `developer-quality-gates`: Require the refactor to reduce Fallow health findings through code structure changes rather than suppressions or weaker thresholds.

## Impact

- Affects `src/main-world/youtube-player-bridge.ts` and potentially `src/shared/youtube-player-model.ts`.
- Depends on characterization coverage from `add-vitest-characterization-tests` being available before implementation.
- Does not intentionally change extension runtime behavior, message payloads, or user-visible YouTube behavior.
