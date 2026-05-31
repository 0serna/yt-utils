## MODIFIED Requirements

### Requirement: Auto-open prioritized engagement panel on the current watch page

The system MUST automatically decide and open the best available YouTube engagement panel for the current confirmed watch-page video. The system MUST treat a changed watch-page URL `v` parameter as a new panel-auto-open session, invalidate pending work from the previous video, and only act when the live player confirms the same current video ID.

#### Scenario: Chapters panel is available and can be opened

- **WHEN** a supported YouTube watch page for the current confirmed video loads
- **AND** the current video's `Chapters`/`Capítulos` engagement panel exists or becomes available
- **AND** visible chapter items (`ytd-macro-markers-list-item-renderer`) can be confirmed within the configured wait window
- **THEN** the system MUST open the chapters panel once
- **AND** the system MUST mark the current video complete

#### Scenario: Chapters not available, Ask panel fallback

- **WHEN** a supported YouTube watch page for the current confirmed video loads
- **AND** no valid chapters panel with visible chapter items is confirmed within the configured wait window
- **AND** the current video's `Ask` panel exists with `visibility="ENGAGEMENT_PANEL_VISIBILITY_HIDDEN"`
- **THEN** the system MUST click the `Ask` control once to expand the panel
- **AND** the system MUST wait up to the configured wait window for the chat input textbox
- **AND** when the chat input textbox is found, the system MUST type the summary prompt into it
- **AND** the system MUST click the Send button once
- **AND** the system MUST mark the current video complete

#### Scenario: Current video's Ask panel is already open

- **WHEN** a supported YouTube watch page for the current confirmed video loads
- **AND** the current video's `Ask` panel is already expanded before chapters evaluation completes
- **AND** the summary prompt has not yet been typed for the current video
- **THEN** the system MUST type the summary prompt into the chat input textbox
- **AND** the system MUST click the Send button once
- **AND** the system MUST mark the current video complete

#### Scenario: User manually opens Ask panel during session

- **WHEN** the user manually opens the `Ask` panel on a supported YouTube watch page
- **AND** the live player confirms the page's current video ID
- **AND** the summary prompt has not yet been typed for the current video
- **THEN** the system MUST type the summary prompt into the chat input textbox
- **AND** the system MUST click the Send button once
- **AND** the system MUST mark the current video complete

#### Scenario: No available panel for the current video

- **WHEN** a supported YouTube watch page for the current confirmed video loads
- **AND** neither a chapters panel nor an Ask panel is available for the current video
- **THEN** the system MUST NOT click any control
- **AND** the system MUST continue silently

#### Scenario: Previous video's Ask panel lingers during SPA navigation

- **WHEN** the user navigates from one supported YouTube watch page video to another without a full page reload
- **AND** an expanded `Ask` panel from the previous video remains in the DOM during the transition
- **THEN** the system MUST NOT treat that stale expanded panel as proof that `Ask` is already open for the current video
- **AND** the system MUST continue evaluating the current video's panels until it can determine the correct action or leave the page unchanged

#### Scenario: Previous video's pending panel wait completes after SPA navigation

- **WHEN** a Chapters or Ask wait that started for a previous video completes after the URL `v` parameter changed
- **THEN** the system MUST NOT click controls, type a prompt, send a prompt, or mark the new video complete from that stale wait

#### Scenario: Chat input is unavailable within the wait window

- **WHEN** the system opens Ask as a fallback for the current confirmed video
- **AND** the chat input textbox or Send button is not available within the configured wait window
- **THEN** the system MUST NOT type or send any message
- **AND** the system MUST leave Ask open without retrying
- **AND** the system MUST mark the current video complete
