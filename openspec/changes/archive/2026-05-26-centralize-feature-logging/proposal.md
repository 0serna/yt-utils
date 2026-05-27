## Why

Feature activation and error reporting are currently inconsistent across YouTube utilities: most features do not log lifecycle events, some errors are only written to the console, and several expected failure paths are intentionally silent. A centralized logging capability will provide persistent, structured JSON logs that an external agent can read for debugging and operational visibility.

## What Changes

- Add a centralized feature logging capability for YouTube features registered through `FeatureRegistry`.
- Persist structured log entries in `chrome.storage.local` under a stable key with bounded retention.
- Automatically log feature activation and deactivation from the registry.
- Automatically log synchronous activation/deactivation failures without blocking other features.
- Extend feature context with a standard logger API so individual features can progressively report runtime errors.
- Mirror logged errors to `console.error` while keeping normal lifecycle events storage-only.
- Exclude global all-pages selection search and background-only flows from this initial scope.

## Capabilities

### New Capabilities

- `feature-logging`: Persistent structured JSON logging for registered YouTube feature lifecycle events and feature-reported errors.

### Modified Capabilities

- `feature-registry`: Registry lifecycle coordination will include logging, feature-specific logger injection, and isolation of activation/deactivation failures.

## Impact

- Affected source files include `src/shared/types.ts`, `src/shared/feature-registry.ts`, and a new shared logging utility under `src/shared/`.
- Registered feature modules may optionally adopt `context.logger.error(...)` over time for runtime errors.
- Uses existing `storage` permission in `manifest.json`; no new browser permission is required.
- Tests should cover log entry creation, retention behavior, registry lifecycle logging, and failure isolation.
