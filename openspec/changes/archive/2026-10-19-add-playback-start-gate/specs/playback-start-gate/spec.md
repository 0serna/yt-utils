# Spec Delta

## Purpose

Hold the first playback of each Watch Session for a fixed 3000 ms so the initial audio, subtitle, and speed work does not start mid-playback.

## ADDED Requirements

### Requirement: Fixed first-playback hold

The system SHALL hold the first playback of each Watch Session for 3000 ms before resuming it.

#### Scenario: Video already playing

- **WHEN** the feature activates on a watch page and the main video is playing
- **THEN** the system pauses the video and resumes it after 3000 ms

#### Scenario: Video starts after activation

- **WHEN** the feature activates on a watch page and the main video starts playing later
- **THEN** the system pauses the video on that first play and resumes it 3000 ms later

#### Scenario: Video stays paused

- **WHEN** the feature activates and the main video never starts playing
- **THEN** the system does not start playback

### Requirement: Resume only after a gate pause

The system SHALL resume playback only when the gate caused the pause and the Watch Session is still current.

#### Scenario: Viewer plays during the hold

- **WHEN** the viewer starts playback while the gate is holding
- **THEN** the system cancels the hold and does not pause again

#### Scenario: Watch Session changes

- **WHEN** the viewer navigates to another video during the hold
- **THEN** the system cancels the hold and does not resume the previous video

#### Scenario: Feature deactivates

- **WHEN** the feature deactivates during the hold
- **THEN** the system cancels the hold and does not resume playback

### Requirement: Skip unsupported playback

The system SHALL NOT hold playback during ads or live streams.

#### Scenario: Ad is playing

- **WHEN** the feature activates or the first play starts while an ad is showing
- **THEN** the system does not pause the video

#### Scenario: Live stream

- **WHEN** the main video is a live stream
- **THEN** the system does not pause the video

### Requirement: Fixed delay does not wait for features

The system SHALL release the hold after 3000 ms even when other features are still working.

#### Scenario: Feature still working

- **WHEN** the 3000 ms elapse and a playback feature has not finished
- **THEN** the system resumes playback without waiting for that feature
