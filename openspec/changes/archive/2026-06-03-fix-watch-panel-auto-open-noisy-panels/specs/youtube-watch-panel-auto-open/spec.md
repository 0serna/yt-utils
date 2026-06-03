## MODIFIED Requirements

### Requirement: Auto-open prioritized engagement panel on the current watch page

The system MUST automatically decide and open the best available YouTube engagement panel for the current confirmed watch-page video. The system MUST treat a changed watch-page URL `v` parameter as a new panel-auto-open session, invalidate pending work from the previous video, and only act when the live player confirms the same current video ID. The system MUST treat only a confirmed Chapters/Capítulos panel with visible chapter items as a valid chapters candidate, and MUST treat ambiguous `In this video` / Timeline / Transcript surfaces as noisy panels rather than valid Chapters.

#### Scenario: Chapters panel is available and can be opened

- **WHEN** a supported YouTube watch page for the current confirmed video loads
- **AND** the current video's `Chapters`/`Capítulos` engagement panel exists or becomes available
- **AND** visible chapter items (`ytd-macro-markers-list-item-renderer`) can be confirmed within the configured wait window
- **THEN** the system MUST open the chapters panel once
- **AND** the system MUST mark the current video complete

#### Scenario: Ambiguous In this video surface does not count as Chapters

- **WHEN** a supported YouTube watch page for the current confirmed video loads
- **AND** YouTube exposes an `In this video`, `Timeline`, or `Transcript` surface without a valid Chapters/Capítulos panel containing visible `ytd-macro-markers-list-item-renderer` items
- **THEN** the system MUST NOT treat that surface as a valid chapters panel
- **AND** the system MUST continue to the Ask fallback when Ask is available

#### Scenario: Chapters not available, Ask panel fallback

- **WHEN** a supported YouTube watch page for the current confirmed video loads
- **AND** no valid chapters panel with visible items is confirmed within the configured wait window
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

#### Scenario: Noisy In this video panel is open during initial auto-open

- **WHEN** a supported YouTube watch page for the current confirmed video is still in its initial panel-auto-open attempt
- **AND** an expanded `In this video`, `Timeline`, or `Transcript` composite panel is present
- **AND** the panel exposes a visible close control
- **THEN** the system MUST close that noisy panel
- **AND** the system MUST continue evaluating the current video's valid Chapters or Ask panels

#### Scenario: Opened Live chat replay panel is present during initial auto-open

- **WHEN** a supported YouTube watch page for the current confirmed video is still in its initial panel-auto-open attempt
- **AND** an expanded `Live chat replay` panel is present
- **AND** the panel exposes a visible close control
- **THEN** the system MUST close that noisy panel
- **AND** the system MUST continue evaluating the current video's valid Chapters or Ask panels

#### Scenario: Live chat replay teaser is present

- **WHEN** a supported YouTube watch page for the current confirmed video shows a `Live chat replay` teaser or card with an `Open panel` control
- **AND** no expanded `Live chat replay` panel is present
- **THEN** the system MUST NOT hide, remove, or interact with the teaser or card

#### Scenario: Noisy panels after auto-open completion

- **WHEN** the panel-auto-open attempt for the current confirmed video has completed or exhausted available actions
- **AND** the user opens an `In this video`, `Timeline`, `Transcript`, or `Live chat replay` panel manually afterward
- **THEN** the system MUST NOT close that panel as part of the completed auto-open session

#### Scenario: No available panel for the current video

- **WHEN** a supported YouTube watch page for the current confirmed video loads
- **AND** neither a chapters panel nor an Ask panel is available for the current video
- **THEN** the system MUST NOT click any allowed panel control
- **AND** the system MUST continue silently

#### Scenario: Previous video's Ask panel lingers during SPA navigation

- **WHEN** the user navigates from one supported YouTube watch page video to another without a full page reload
- **AND** an expanded `Ask` panel from the previous video remains in the DOM during the transition
- **THEN** the system MUST NOT treat that stale expanded panel as proof that `Ask` is already open for the current video
- **AND** the system MUST continue evaluating the current video's panels until it can determine the correct action or leave the page unchanged

#### Scenario: Previous video's noisy panel lingers during SPA navigation

- **WHEN** the user navigates from one supported YouTube watch page video to another without a full page reload
- **AND** an expanded `In this video`, `Timeline`, `Transcript`, or `Live chat replay` panel from the previous video remains in the DOM during the new video's initial panel-auto-open attempt
- **AND** the stale noisy panel exposes a visible close control
- **THEN** the system MUST close that noisy panel
- **AND** the system MUST continue evaluating the current video's valid Chapters or Ask panels

#### Scenario: Previous video's pending panel wait completes after SPA navigation

- **WHEN** a Chapters or Ask wait that started for a previous video completes after the URL `v` parameter changed
- **THEN** the system MUST NOT click controls, type a prompt, send a prompt, or mark the new video complete from that stale wait

#### Scenario: Chat input is unavailable within the wait window

- **WHEN** the system opens Ask as a fallback for the current confirmed video
- **AND** the chat input textbox or Send button is not available within the configured wait window
- **THEN** the system MUST NOT type or send any message
- **AND** the system MUST leave Ask open without retrying
- **AND** the system MUST mark the current video complete
