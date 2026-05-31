# audio-language-subtitle-policy Specification

## Purpose

Define subtitle policy for YouTube watch pages based on the active audio language.

## Requirements

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

### Requirement: Spanish audio SHALL disable subtitles

The extension SHALL turn subtitles off when the active audio language is Spanish.

#### Scenario: Spanish audio video loads with subtitles on

- **WHEN** a watch page becomes active for a video whose active audio language is Spanish and subtitles are currently enabled
- **THEN** the extension disables subtitles for that video

#### Scenario: Spanish audio video loads with subtitles off

- **WHEN** a watch page becomes active for a video whose active audio language is Spanish and subtitles are already disabled
- **THEN** the extension leaves subtitles off without showing any UI

### Requirement: Non-Spanish audio SHALL prefer direct English subtitles

The extension SHALL enable subtitles for non-Spanish audio and select a direct English subtitle track when one is available.

#### Scenario: Direct English track exists

- **WHEN** a watch page becomes active for a video whose active audio language is not Spanish and the player exposes a direct English subtitle track
- **THEN** the extension enables subtitles and selects the direct English track

### Requirement: Non-Spanish audio SHALL fall back to auto-translated English

The extension SHALL select auto-translated English subtitles when the audio is not Spanish, no direct English subtitle track is available, and the available subtitle track can be translated to English.

#### Scenario: Direct English track is missing but English translation is available

- **WHEN** a watch page becomes active for a video whose active audio language is not Spanish, no direct English subtitle track exists, and the available subtitle track can be translated to English
- **THEN** the extension enables subtitles and selects English auto-translation

### Requirement: Unavailable English subtitles SHALL leave subtitles off

The extension SHALL leave subtitles disabled when the active audio language is not Spanish but neither direct English subtitles nor English auto-translation can be selected.

#### Scenario: No route to English subtitles exists

- **WHEN** a watch page becomes active for a video whose active audio language is not Spanish and the player cannot provide either direct English subtitles or English auto-translation
- **THEN** the extension disables subtitles for that video

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

### Requirement: Subtitle policy SHALL stay silent

The extension SHALL apply subtitle policy without adding visible controls, prompts, notifications, or other new user-facing UI.

#### Scenario: Policy runs on watch page activation

- **WHEN** the extension evaluates subtitle policy for a watch page
- **THEN** it applies the result without adding any new visible interface elements
