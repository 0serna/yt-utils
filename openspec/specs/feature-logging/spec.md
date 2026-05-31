## Purpose

Define persistent structured JSON logging for registered YouTube feature lifecycle events and feature-reported errors, stored in `chrome.storage.local` and readable by external agents.

## Requirements

### Requirement: Logs are stored in a stable extension storage key

The system SHALL persist feature log entries in `chrome.storage.local` under the key `yt-utils:logs` as a chronological JSON array, and SHALL preserve entries generated concurrently by multiple feature lifecycle operations.

#### Scenario: Agent reads stored logs

- **WHEN** an external agent reads `yt-utils:logs` from `chrome.storage.local`
- **THEN** the value is a JSON array of feature log entries ordered from oldest to newest

#### Scenario: Concurrent lifecycle events are recorded

- **WHEN** multiple features record activation or deactivation events during the same navigation burst
- **THEN** each event is preserved in `yt-utils:logs`
- **AND** no event is lost because another log write used an older storage snapshot

### Requirement: Log entries use a structured schema

Each feature log entry SHALL include `timestamp`, `feature`, `event`, and `url`; it SHALL include `videoId` when the current URL contains a `v` query parameter; it SHALL include `phase` and normalized `error` details for error events.

#### Scenario: Lifecycle entry is recorded

- **WHEN** a registered feature logs a lifecycle event
- **THEN** the entry includes an ISO timestamp, the feature name, the lifecycle event, the full current URL, and the current video ID when available

#### Scenario: Error entry is recorded

- **WHEN** a registered feature logs an error
- **THEN** the entry has `event` set to `error` and includes the error message, optional code, optional stack, and phase when provided

### Requirement: Log retention is bounded

The system SHALL retain only the latest 1000 feature log entries in `yt-utils:logs`, including during concurrent append bursts.

#### Scenario: Log limit is exceeded

- **WHEN** appending a log entry causes the stored log array to exceed 1000 entries
- **THEN** the system removes the oldest entries and retains the latest 1000 entries

#### Scenario: Concurrent burst exceeds log limit

- **WHEN** concurrent log appends cause the stored log array to exceed 1000 entries
- **THEN** the system preserves the newest 1000 entries in chronological append order

### Requirement: Feature logger exposes standard methods

The system SHALL expose a feature-scoped logger with `activation()`, `deactivation()`, and `error(error, meta?)` methods.

#### Scenario: Feature reports a runtime error

- **WHEN** a registered feature calls `context.logger.error(error, { phase: "runtime" })`
- **THEN** the system persists a structured error log entry for that feature

### Requirement: Error logs are mirrored to console

The system SHALL mirror logged errors to `console.error` and SHALL NOT mirror normal activation or deactivation logs to the console.

#### Scenario: Runtime error is logged

- **WHEN** a feature logger records an error
- **THEN** the error is persisted in storage and written to `console.error`

#### Scenario: Activation is logged

- **WHEN** a feature logger records activation
- **THEN** the activation event is persisted in storage and is not written to the console
