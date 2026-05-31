## ADDED Requirements

### Requirement: Watch video sessions are identified by current video ID

The system SHALL identify a supported desktop YouTube watch-page video session by the current URL `v` query parameter.

#### Scenario: Video ID changes during SPA navigation

- **WHEN** the user navigates from one supported YouTube watch-page video to another without a full page reload
- **AND** the URL `v` query parameter changes
- **THEN** the system treats the new video ID as a new watch video session

#### Scenario: Non-video URL parameter changes

- **WHEN** the user remains on the same supported YouTube watch-page video
- **AND** URL parameters other than `v` change
- **THEN** the system does not treat the change as a new watch video session

### Requirement: Watch video actions require live player confirmation

The system SHALL require the live YouTube player state to confirm the current URL video ID before applying watch-video actions that affect panels, subtitles, or playback speed.

#### Scenario: URL changed before player updates

- **WHEN** the URL `v` query parameter identifies a new video
- **AND** the live player or bridge still reports a different video ID
- **THEN** the system does not apply watch-video actions for the new session yet

#### Scenario: Player confirms current URL video

- **WHEN** the URL `v` query parameter identifies a supported watch video
- **AND** the live player or bridge reports the same video ID
- **THEN** the system may apply watch-video actions for that confirmed session

### Requirement: Stale watch video work is invalidated on video change

The system SHALL invalidate asynchronous work associated with the previous watch video session when the URL video ID changes.

#### Scenario: Previous video wait completes after navigation

- **WHEN** asynchronous work started for a previous watch video completes after SPA navigation to a new video
- **THEN** that stale work does not click controls, change subtitle state, change playback speed, mark the new video complete, or update per-video state for the new session
