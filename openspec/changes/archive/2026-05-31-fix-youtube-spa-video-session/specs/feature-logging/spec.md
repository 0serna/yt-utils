## MODIFIED Requirements

### Requirement: Logs are stored in a stable extension storage key

The system SHALL persist feature log entries in `chrome.storage.local` under the key `yt-utils:logs` as a chronological JSON array, and SHALL preserve entries generated concurrently by multiple feature lifecycle operations.

#### Scenario: Agent reads stored logs

- **WHEN** an external agent reads `yt-utils:logs` from `chrome.storage.local`
- **THEN** the value is a JSON array of feature log entries ordered from oldest to newest

#### Scenario: Concurrent lifecycle events are recorded

- **WHEN** multiple features record activation or deactivation events during the same navigation burst
- **THEN** each event is preserved in `yt-utils:logs`
- **AND** no event is lost because another log write used an older storage snapshot

### Requirement: Log retention is bounded

The system SHALL retain only the latest 1000 feature log entries in `yt-utils:logs`, including during concurrent append bursts.

#### Scenario: Log limit is exceeded

- **WHEN** appending a log entry causes the stored log array to exceed 1000 entries
- **THEN** the system removes the oldest entries and retains the latest 1000 entries

#### Scenario: Concurrent burst exceeds log limit

- **WHEN** concurrent log appends cause the stored log array to exceed 1000 entries
- **THEN** the system preserves the newest 1000 entries in chronological append order
