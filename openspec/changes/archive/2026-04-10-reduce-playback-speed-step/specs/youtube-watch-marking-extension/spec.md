## MODIFIED Requirements

### Requirement: Extension shows an inline desktop watch-page playback speed control
The extension SHALL render a single inline playback-speed control on supported desktop `www.youtube.com/watch` pages and place it within the watch-page action row near the existing inline action area. The control SHALL display a decrement button, the current speed as visible text using an `x` suffix, and an increment button. The control SHALL use `0.05` increments, default to `1.0x`, clamp values to the inclusive range of `0.5x` through `2.0x`, and disable the decrement or increment button when the current value is already at the corresponding bound.

#### Scenario: Supported desktop watch page renders the playback speed control
- **WHEN** the user opens a supported desktop YouTube watch page and the action row finishes rendering
- **THEN** the extension displays a single inline playback-speed control in that row with visible current-speed text and `-` / `+` controls

#### Scenario: Playback speed increases and decreases in 0.05 steps
- **WHEN** the user activates the increment or decrement button on a supported desktop watch page
- **THEN** the extension adjusts the current playback speed by `0.05` in the selected direction

#### Scenario: Playback speed reaches lower bound
- **WHEN** the current saved or selected playback speed is `0.5x`
- **THEN** the decrement button is disabled and the increment button remains available

#### Scenario: Playback speed reaches upper bound
- **WHEN** the current saved or selected playback speed is `2.0x`
- **THEN** the increment button is disabled and the decrement button remains available

#### Scenario: Unsupported YouTube surface does not render playback speed control
- **WHEN** the user is on a non-desktop or non-watch YouTube surface
- **THEN** the extension does not render the inline playback-speed control
