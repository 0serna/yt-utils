## ADDED Requirements

### Requirement: Prefer Chapters panel before Ask panel

The system MUST prioritize the YouTube `Chapters`/`Capítulos` engagement panel over the `Ask`/`Preguntar` engagement panel for the current supported watch-page video when a real chapter list is available.

#### Scenario: Current video has visible chapters and Ask is also available

- **WHEN** a supported YouTube watch page for the current video exposes a visible `Chapters`/`Capítulos` control or panel with a real chapter list
- **AND** the current video's `Ask`/`Preguntar` UI is also available
- **THEN** the system MUST open the `Chapters`/`Capítulos` engagement panel
- **AND** the system MUST NOT open the `Ask`/`Preguntar` engagement panel for that automatic opening decision

#### Scenario: Chapters control exists without a real chapter list

- **WHEN** a supported YouTube watch page for the current video exposes a `Chapters`/`Capítulos` control or panel
- **AND** no visible usable chapter list can be confirmed within the configured wait window
- **AND** the current video's `Ask`/`Preguntar` UI is available
- **THEN** the system MUST open the `Ask`/`Preguntar` engagement panel instead
- **AND** the system MUST evaluate the Ask summarize chip behavior for that fallback opening

#### Scenario: No chapters are available and Ask is available

- **WHEN** a supported YouTube watch page for the current video does not expose a valid `Chapters`/`Capítulos` panel within the configured wait window
- **AND** the current video's `Ask`/`Preguntar` UI is available
- **THEN** the system MUST open the `Ask`/`Preguntar` engagement panel
- **AND** the system MUST evaluate the Ask summarize chip behavior for that fallback opening

#### Scenario: Neither Chapters nor Ask is available

- **WHEN** a supported YouTube watch page for the current video does not expose a valid `Chapters`/`Capítulos` panel
- **AND** the current video's `Ask`/`Preguntar` UI is not available
- **THEN** the system MUST leave the page unchanged
