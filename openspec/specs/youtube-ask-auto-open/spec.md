## Purpose

Automatically open the YouTube Ask panel on supported watch pages when the current video's panel is closed.

## Requirements

### Requirement: Auto-open Ask panel on supported watch pages

The system MUST automatically open the YouTube `Ask` panel for the current supported watch-page video when that video's Ask UI is available and the current video's panel is closed.

#### Scenario: Ask panel is closed for the current video

- **WHEN** a supported YouTube watch page for the current video loads and the current video's `Ask` panel exists with `visibility="ENGAGEMENT_PANEL_VISIBILITY_HIDDEN"`
- **THEN** the system MUST click the `Ask` control once to expand the panel
- **AND** the panel MUST become visible to the user

#### Scenario: Current video's Ask panel is already open

- **WHEN** a supported YouTube watch page for the current video loads and the current video's `Ask` panel is already expanded
- **THEN** the system MUST NOT click the `Ask` control again

#### Scenario: Previous video's Ask panel lingers during SPA navigation

- **WHEN** the user navigates from one supported YouTube watch page video to another without a full page reload
- **AND** an expanded `Ask` panel from the previous video remains in the DOM during the transition
- **THEN** the system MUST NOT treat that stale expanded panel as proof that `Ask` is already open for the current video
- **AND** the system MUST continue evaluating the current video's `Ask` UI until it can determine whether to open `Ask` or leave the page unchanged
