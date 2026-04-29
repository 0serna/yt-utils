## Why

The isolated-world player client and MAIN-world YouTube player bridge duplicate protocol types, constants, and pure helper logic. Consolidating that shared model removes real duplication while making the message boundary easier to reason about and validate.

## What Changes

- Extract shared YouTube player bridge model types and protocol constants into a pure shared module.
- Extract pure normalization/signature helpers used by both sides of the bridge where applicable.
- Update the MAIN-world bridge and isolated-world client to import the shared model instead of duplicating definitions.
- Preserve the existing postMessage protocol and runtime behavior.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `project-structure`: Clarify that shared pure modules can be used by both MAIN-world and isolated-world scripts when they avoid side effects and runtime-specific APIs.

## Impact

- Affects `src/main-world/youtube-player-bridge.ts`, `src/shared/youtube-player.ts`, and a new or updated shared player model module.
- Requires build validation to ensure Vite/CRX bundles shared imports correctly for the MAIN-world content script.
- Does not intentionally change subtitle policy, player snapshot fields, or bridge message behavior.
