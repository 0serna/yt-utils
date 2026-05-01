## Purpose

Automatically open the most useful YouTube engagement panel on supported watch pages: Chapters/Capítulos when a valid chapter list exists, falling back to Ask/Preguntar with summarize chip selection.

## Requirements

### Requirement: Auto-open prioritized engagement panel on the current watch page

The system MUST automatically decide and open the best available YouTube engagement panel for the current watch-page video.

#### Scenario: Chapters panel is available and can be opened

- **WHEN** a supported YouTube watch page for the current video loads
- **AND** the current video's `Chapters`/`Capítulos` engagement panel exists or becomes available
- **AND** visible chapter items (`ytd-macro-markers-list-item-renderer`) can be confirmed within the configured wait window
- **THEN** the system MUST open the chapters panel once
- **AND** the system MUST mark the current video complete

#### Scenario: Chapters not available, Ask panel fallback

- **WHEN** a supported YouTube watch page for the current video loads
- **AND** no valid chapters panel with visible chapter items is confirmed within the configured wait window
- **AND** the current video's `Ask` panel exists with `visibility="ENGAGEMENT_PANEL_VISIBILITY_HIDDEN"`
- **THEN** the system MUST click the `Ask` control once to expand the panel
- **AND** the system MUST wait up to the configured wait window for a visible enabled summarize chip
- **AND** when a summarize chip matching `Summarize the video`/`Resumir`/`Resumir el video` is found, the system MUST click it once
- **AND** the system MUST mark the current video complete

#### Scenario: Current video's Ask panel is already open

- **WHEN** a supported YouTube watch page for the current video loads
- **AND** the current video's `Ask` panel is already expanded before chapters evaluation completes
- **THEN** the system MUST NOT click the `Ask` control again
- **AND** the system MUST mark the current video complete

#### Scenario: No available panel for the current video

- **WHEN** a supported YouTube watch page for the current video loads
- **AND** neither a chapters panel nor an Ask panel is available for the current video
- **THEN** the system MUST NOT click any control
- **AND** the system MUST continue silently

#### Scenario: Previous video's Ask panel lingers during SPA navigation

- **WHEN** the user navigates from one supported YouTube watch page video to another without a full page reload
- **AND** an expanded `Ask` panel from the previous video remains in the DOM during the transition
- **THEN** the system MUST NOT treat that stale expanded panel as proof that `Ask` is already open for the current video
- **AND** the system MUST continue evaluating the current video's panels until it can determine the correct action or leave the page unchanged

#### Scenario: Summarize chip is disabled or absent within the wait window

- **WHEN** the system opens Ask as a fallback for the current video
- **AND** no enabled summarize chip matching known labels appears within the configured wait window
- **THEN** the system MUST NOT click any chip
- **AND** the system MUST leave Ask open without retrying
- **AND** the system MUST mark the current video complete
