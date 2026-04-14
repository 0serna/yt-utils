## MODIFIED Requirements

### Requirement: Extension shows an inline desktop watch-page playback speed control
The extension SHALL render a single inline playback-speed control on supported desktop `www.youtube.com/watch` pages near the existing inline action area.
The control SHALL display decrement and increment buttons plus the current speed as visible text with an `x` suffix.
The control SHALL use `0.05` increments, clamp values to `0.50x` through `2.00x`, disable the button at the matching bound, and reflect the current video's initialized playback speed.

#### Scenario: Supported desktop watch page renders the playback speed control
- **WHEN** the user opens a supported desktop YouTube watch page and the action row finishes rendering
- **THEN** the extension displays a single inline playback-speed control in that row with visible current-speed text and `-` / `+` controls

#### Scenario: Playback speed reaches lower bound
- **WHEN** the current initialized or user-selected playback speed is `0.50x`
- **THEN** the decrement button is disabled and the increment button remains available

#### Scenario: Playback speed reaches upper bound
- **WHEN** the current initialized or user-selected playback speed is `2.00x`
- **THEN** the increment button is disabled and the decrement button remains available

#### Scenario: Unsupported YouTube surface does not render playback speed control
- **WHEN** the user is on a non-desktop or non-watch YouTube surface
- **THEN** the extension does not render the inline playback-speed control

### Requirement: Extension applies and persists a global playback speed preference
The extension SHALL apply playback-speed changes immediately to the current watch page by setting the active `HTMLVideoElement.playbackRate` directly.
Each supported watch page SHALL initialize playback speed independently for the current video instead of loading a saved global default.
The initial speed SHALL be `1.00x`, and the extension SHALL change it to `0.90x` only when the current video's inferred audio language is English.
Manual changes made with the inline playback-speed control SHALL apply only to the current video and SHALL NOT become the default for future videos, future tabs, or later watch-page navigations.

#### Scenario: English audio video loads
- **WHEN** a supported watch page becomes active for a video whose inferred audio language is English and the user has not changed the playback speed yet
- **THEN** the extension applies `0.90x` to that video's player and reflects `0.90x` in the inline control

#### Scenario: Non-English video loads
- **WHEN** a supported watch page becomes active for a video whose inferred audio language is not English and the user has not changed the playback speed yet
- **THEN** the extension applies `1.00x` to that video's player and reflects `1.00x` in the inline control

#### Scenario: Audio language cannot be inferred
- **WHEN** a supported watch page becomes active for a video whose audio language cannot be inferred and the user has not changed the playback speed yet
- **THEN** the extension keeps playback speed at `1.00x` and reflects `1.00x` in the inline control

#### Scenario: User changes playback speed on the current video
- **WHEN** the user activates the increment or decrement button on a supported desktop watch page
- **THEN** the extension updates the current page's playback speed immediately and keeps that manual value only for the current video

#### Scenario: Future watch page re-evaluates its own language default
- **WHEN** a supported watch page is opened or navigated to after the user previously changed playback speed on another video
- **THEN** the extension ignores the prior video's manual speed and initializes the new video's speed from its own language-based default
