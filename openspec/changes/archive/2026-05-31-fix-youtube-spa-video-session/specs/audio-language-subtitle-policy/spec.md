## MODIFIED Requirements

### Requirement: Watch-page subtitle policy SHALL use the active audio language

The extension SHALL determine subtitle policy for a YouTube watch page from the active player audio language, using the live player state for the current confirmed video instead of document language or stale bootstrap data.

#### Scenario: Active audio track reports Spanish

- **WHEN** the current confirmed watch page's active player audio track reports a Spanish language code
- **THEN** the extension treats the video as Spanish-audio content for subtitle policy decisions

#### Scenario: Active audio track is undefined

- **WHEN** the current confirmed watch page's active audio track does not expose a usable language code
- **THEN** the extension falls back to current-video caption metadata from the live player state before deciding the subtitle policy

#### Scenario: URL and player video IDs do not match during SPA navigation

- **WHEN** the URL `v` query parameter identifies a watch video
- **AND** the live player or bridge reports a different video ID
- **THEN** the extension does not apply subtitle policy until the live player confirms the current URL video ID

### Requirement: Manual per-video overrides SHALL be respected

After the extension applies subtitle policy for a video, it SHALL stop reapplying the policy for that same video if the user manually changes subtitle or audio behavior. Manual override state and policy application state SHALL be scoped to the current confirmed video and SHALL NOT carry over to another watch video reached through SPA navigation.

#### Scenario: User turns subtitles off after policy enabled them

- **WHEN** the extension has already enabled English subtitles for the current confirmed video and the user manually disables subtitles
- **THEN** the extension does not re-enable subtitles again for that video

#### Scenario: User chooses a different subtitle or audio track

- **WHEN** the extension has already applied subtitle policy for the current confirmed video and the user manually selects a different subtitle track or audio track
- **THEN** the extension does not reapply its preferred subtitle selection again for that video

#### Scenario: New video after manual override

- **WHEN** the user manually overrides subtitle behavior on one video
- **AND** then navigates to another supported watch video without a full page reload
- **THEN** the extension evaluates subtitle policy for the new confirmed video without treating the prior video's manual override as applying to the new video

#### Scenario: Previous video subtitle work completes after navigation

- **WHEN** subtitle policy work that started for a previous video completes after SPA navigation to a new video
- **THEN** that stale work does not change subtitle state or record applied policy state for the new video
