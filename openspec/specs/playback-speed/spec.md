# playback-speed Specification

## Purpose

Provide an inline playback-speed control on supported YouTube watch pages and initialize each video's speed from its inferred audio language.

## Requirements

### Requirement: Extension shows an inline desktop watch-page playback speed control

The extension SHALL render a single inline playback-speed control on supported desktop `www.youtube.com/watch` pages near the existing inline action area.
The control SHALL display decrement and increment buttons plus the current speed as visible text with an `x` suffix.
The control SHALL use `0.05` increments, clamp values to `0.50x` through `2.00x`, disable the button at the matching bound, and reflect the current video's initialized playback speed.
The current speed text SHALL be clickable and SHALL reset playback speed to `1.00x` when activated.

#### Scenario: Supported desktop watch page renders the playback speed control

- **WHEN** the user opens a supported desktop YouTube watch page and the action row finishes rendering
- **THEN** the extension displays a single inline playback-speed control in that row with visible current-speed text and `-` / `+` controls

#### Scenario: Playback speed reaches lower bound

- **WHEN** the current saved or selected playback speed is `0.50x`
- **THEN** the decrement button is disabled and the increment button remains available

#### Scenario: Playback speed reaches upper bound

- **WHEN** the current saved or selected playback speed is `2.00x`
- **THEN** the increment button is disabled and the decrement button remains available

#### Scenario: Unsupported YouTube surface does not render playback speed control

- **WHEN** the user is on a non-desktop or non-watch YouTube surface
- **THEN** the extension does not render the inline playback-speed control

#### Scenario: User clicks current speed text to reset to default

- **WHEN** the user clicks the current speed text in the inline playback-speed control
- **THEN** the extension resets playback speed to `1.00x`, applies it to the video, and disables automatic language-based speed changes for the current video
- **AND WHEN** the speed is already `1.00x`
- **THEN** the click has no effect

### Requirement: Extension applies and persists a per-video playback speed preference

The extension SHALL apply playback-speed changes immediately to the current confirmed watch page by setting the active `HTMLVideoElement.playbackRate` directly. Each supported watch page video session SHALL initialize playback speed independently for the current confirmed video instead of loading a saved global default or reusing state from a prior SPA video. The initial speed SHALL be `1.00x`, the extension SHALL change it to `0.90x` when the current video's inferred audio language is English, and it SHALL change it to `1.10x` when the inferred audio language is Spanish. Language-aware initialization SHALL infer audio language from the current player's active audio-track metadata, including current YouTube metadata shapes exposed by `getAudioTrack()`, and SHALL NOT infer audio language from caption-track metadata alone. Manual changes made with the inline playback-speed control SHALL apply only to the current video and SHALL NOT become the default for future videos, future tabs, or later watch-page navigations.

#### Scenario: English audio video loads

- **WHEN** a supported watch page becomes active for a confirmed video whose inferred audio language is English and the user has not changed the playback speed yet
- **THEN** the extension applies `0.90x` to that video's player and reflects `0.90x` in the inline control

#### Scenario: English audio video reports current YouTube metadata shape

- **WHEN** a supported watch page becomes active for a confirmed video whose active audio track reports English metadata through the current YouTube audio-track metadata shape
- **AND** the user has not changed the playback speed yet
- **THEN** the extension applies `0.90x` to that video's player and reflects `0.90x` in the inline control

#### Scenario: Spanish audio video loads

- **WHEN** a supported watch page becomes active for a confirmed video whose inferred audio language is Spanish and the user has not changed the playback speed yet
- **THEN** the extension applies `1.10x` to that video's player and reflects `1.10x` in the inline control

#### Scenario: Other language video loads

- **WHEN** a supported watch page becomes active for a confirmed video whose inferred audio language is neither English nor Spanish and the user has not changed the playback speed yet
- **THEN** the extension applies `1.00x` to that video's player and reflects `1.00x` in the inline control

#### Scenario: Caption tracks report Spanish but active audio language is unknown

- **WHEN** a supported watch page becomes active for a confirmed video whose active audio language cannot be inferred from active audio-track metadata
- **AND** the player exposes a Spanish caption track
- **AND** the user has not changed the playback speed yet
- **THEN** the extension keeps playback speed at `1.00x` and reflects `1.00x` in the inline control

#### Scenario: Audio language cannot be inferred

- **WHEN** a supported watch page becomes active for a confirmed video whose audio language cannot be inferred and the user has not changed the playback speed yet
- **THEN** the extension keeps playback speed at `1.00x` and reflects `1.00x` in the inline control

#### Scenario: User changes playback speed on the current video

- **WHEN** the user activates the increment or decrement button on a supported desktop watch page
- **THEN** the extension updates the current page's playback speed immediately and keeps that manual value only for the current video

#### Scenario: Future watch page re-evaluates its own language default

- **WHEN** a supported watch page is opened or navigated to after the user previously changed playback speed on another video
- **THEN** the extension ignores the prior video's manual speed and initializes the new video's speed from its own language-based default

#### Scenario: Previous video speed work completes after navigation

- **WHEN** playback-speed initialization that started for a previous video completes after SPA navigation to a new video
- **THEN** that stale work does not change the new video's playback speed or control state

#### Scenario: URL and player video IDs do not match during SPA navigation

- **WHEN** the URL `v` query parameter identifies a watch video
- **AND** the live player or bridge reports a different video ID
- **THEN** the extension does not initialize language-based playback speed until the live player confirms the current URL video ID
