## MODIFIED Requirements

### Requirement: Auto-open Ask panel on supported watch pages

The system MUST automatically open the YouTube `Ask` panel for the current supported watch-page video when that video's Ask UI is available, the current video's Ask panel is closed, and no valid `Chapters`/`Capítulos` engagement panel is available for the current video within the configured wait window. When the system opens Ask as this fallback, it MUST select the enabled summarize chip when that chip appears within the configured wait window.

#### Scenario: Ask panel is closed for the current video and chapters are unavailable

- **WHEN** a supported YouTube watch page for the current video loads and the current video's `Ask` panel exists with `visibility="ENGAGEMENT_PANEL_VISIBILITY_HIDDEN"`
- **AND** no valid `Chapters`/`Capítulos` engagement panel is available for the current video within the configured wait window
- **THEN** the system MUST click the `Ask` control once to expand the panel
- **AND** the panel MUST become visible to the user
- **AND** the system MUST wait for an enabled summarize chip before completing the fallback opening decision

#### Scenario: Ask fallback opens and summarize chip is available

- **WHEN** the system opens the current video's `Ask` panel as the automatic fallback
- **AND** a visible enabled Ask chip matching `Summarize the video`, `Resumir`, or `Resumir el video` appears within the configured wait window
- **THEN** the system MUST click that summarize chip once
- **AND** the system MUST consider the current video complete without waiting for the generated summary response

#### Scenario: Ask fallback opens and summarize chip is unavailable

- **WHEN** the system opens the current video's `Ask` panel as the automatic fallback
- **AND** no visible enabled Ask chip matching `Summarize the video`, `Resumir`, or `Resumir el video` appears within the configured wait window
- **THEN** the system MUST leave the `Ask` panel open
- **AND** the system MUST consider the current video complete without repeatedly retrying the summarize chip selection

#### Scenario: Ask panel was already open before automatic fallback

- **WHEN** a supported YouTube watch page for the current video loads and the current video's `Ask` panel is already expanded before the system opens it as a fallback
- **THEN** the system MUST NOT select the summarize chip automatically

#### Scenario: Current video's Ask panel is already open

- **WHEN** a supported YouTube watch page for the current video loads and the current video's `Ask` panel is already expanded
- **THEN** the system MUST NOT click the `Ask` control again
- **AND** the system MUST NOT select the summarize chip automatically

#### Scenario: Current video has valid chapters

- **WHEN** a supported YouTube watch page for the current video exposes a visible `Chapters`/`Capítulos` engagement panel with a real chapter list
- **AND** the current video's `Ask` UI is available
- **THEN** the system MUST NOT open the `Ask` panel for that automatic opening decision

#### Scenario: Previous video's Ask panel lingers during SPA navigation

- **WHEN** the user navigates from one supported YouTube watch page video to another without a full page reload
- **AND** an expanded `Ask` panel from the previous video remains in the DOM during the transition
- **THEN** the system MUST NOT treat that stale expanded panel as proof that `Ask` is already open for the current video
- **AND** the system MUST continue evaluating the current video's panel UI until it can determine whether to open `Chapters`, open `Ask`, or leave the page unchanged
