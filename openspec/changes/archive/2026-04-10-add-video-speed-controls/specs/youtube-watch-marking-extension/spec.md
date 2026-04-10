## ADDED Requirements

### Requirement: Extension shows an inline desktop watch-page playback speed control
The extension SHALL render a single inline playback-speed control on supported desktop `www.youtube.com/watch` pages and place it within the watch-page action row near the existing inline action area. The control SHALL display a decrement button, the current speed as visible text using an `x` suffix, and an increment button. The control SHALL use `0.1` increments, default to `1.0x`, clamp values to the inclusive range `0.5x` through `2.0x`, and disable the decrement or increment button when the current value is already at the corresponding bound.

#### Scenario: Supported desktop watch page renders the playback speed control
- **WHEN** the user opens a supported desktop YouTube watch page and the action row finishes rendering
- **THEN** the extension displays a single inline playback-speed control in that row with visible current-speed text and `-` / `+` controls

#### Scenario: Playback speed reaches lower bound
- **WHEN** the current saved or selected playback speed is `0.5x`
- **THEN** the decrement button is disabled and the increment button remains available

#### Scenario: Playback speed reaches upper bound
- **WHEN** the current saved or selected playback speed is `2.0x`
- **THEN** the increment button is disabled and the decrement button remains available

#### Scenario: Unsupported YouTube surface does not render playback speed control
- **WHEN** the user is on a non-desktop or non-watch YouTube surface
- **THEN** the extension does not render the inline playback-speed control

### Requirement: Extension applies and persists a global playback speed preference
The extension SHALL apply playback-speed changes immediately to the current watch page by setting the active `HTMLVideoElement.playbackRate` directly. Whenever the user changes the inline playback-speed control, the extension SHALL persist that selected value locally as the new global default. Supported watch pages initialized after that change, including future tabs and future video navigations, SHALL load and apply the saved default automatically. Already-open tabs that were initialized before the save SHALL NOT be updated automatically by a later change made elsewhere.

#### Scenario: User changes playback speed on the current video
- **WHEN** the user activates the increment or decrement button on a supported desktop watch page
- **THEN** the extension updates the current page's playback speed immediately and saves that value as the new global default

#### Scenario: Future watch page inherits saved speed
- **WHEN** a supported watch page is opened or navigated to after a playback speed value has been saved
- **THEN** the extension applies the saved playback speed automatically to that page's video and shows the same value in the inline control

#### Scenario: Existing tab does not live-sync another tab's change
- **WHEN** one supported watch-page tab has already initialized with one playback speed and another tab later saves a different playback speed value
- **THEN** the already-initialized tab keeps its current playback speed until the user changes it locally or navigates to a newly initialized supported watch page
