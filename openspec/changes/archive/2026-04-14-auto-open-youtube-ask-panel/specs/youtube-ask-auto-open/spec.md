## ADDED Requirements

### Requirement: Auto-open Ask panel on supported watch pages
The system MUST automatically open the YouTube `Ask` panel when a supported YouTube watch page loads and the panel is currently closed.

#### Scenario: Ask panel is closed on load
- **WHEN** a supported YouTube watch page loads and the `Ask` panel exists with `visibility="ENGAGEMENT_PANEL_VISIBILITY_HIDDEN"`
- **THEN** the system MUST click the `Ask` control once to expand the panel
- **AND** the panel MUST become visible to the user

#### Scenario: Ask panel is already open
- **WHEN** a supported YouTube watch page loads and the `Ask` panel already has `visibility="ENGAGEMENT_PANEL_VISIBILITY_EXPANDED"`
- **THEN** the system MUST NOT click the `Ask` control again

### Requirement: No-op when Ask panel is unavailable
The system MUST do nothing when a supported watch page does not expose the `Ask` panel.

#### Scenario: Video does not expose Ask
- **WHEN** a supported YouTube watch page loads and the `Ask` panel cannot be found in the DOM
- **THEN** the system MUST NOT throw an error
- **AND** the system MUST leave the page unchanged

### Requirement: Respect manual closure during the same video session
The system MUST NOT reopen the `Ask` panel after the user closes it on the same video session.

#### Scenario: User closes Ask after the automatic open
- **WHEN** the system has already opened the `Ask` panel for the current video session
- **AND** the user closes the panel manually
- **THEN** the system MUST NOT reopen the panel again until the next video navigation
