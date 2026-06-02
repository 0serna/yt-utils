# audio-language-subtitle-policy Specification

## Purpose

Define subtitle policy for YouTube watch pages based on the active audio language.

## Requirements

### Requirement: Watch-page subtitle policy SHALL use the active audio language

The extension SHALL determine subtitle policy for a YouTube watch page from the active player audio language, using the live player state for the current confirmed video instead of document language, caption-only metadata, or stale bootstrap data. The extension SHALL treat a missing or unusable active audio language as unknown for subtitle policy decisions.

#### Scenario: Active audio track reports English

- **WHEN** the current confirmed watch page's active player audio track reports an English language code
- **THEN** the extension treats the video as English-audio content for subtitle policy decisions

#### Scenario: Active audio track reports Spanish

- **WHEN** the current confirmed watch page's active player audio track reports a Spanish language code
- **THEN** the extension treats the video as non-English-audio content for subtitle policy decisions

#### Scenario: Active audio track is undefined

- **WHEN** the current confirmed watch page's active audio track does not expose a usable language code
- **THEN** the extension treats the audio language as unknown and does not activate subtitles from caption metadata alone

#### Scenario: URL and player video IDs do not match during SPA navigation

- **WHEN** the URL `v` query parameter identifies a watch video
- **AND** the live player or bridge reports a different video ID
- **THEN** the extension does not apply subtitle policy until the live player confirms the current URL video ID

### Requirement: English audio SHALL prefer direct English subtitles

The extension SHALL enable subtitles only for English audio and select a direct English subtitle track when one is available.

#### Scenario: Direct English track exists for English audio

- **WHEN** a watch page becomes active for a video whose active audio language is English
- **AND** the player exposes a direct English subtitle track
- **THEN** the extension enables subtitles and selects the direct English track

#### Scenario: Direct English track exists for non-English audio

- **WHEN** a watch page becomes active for a video whose active audio language is not English
- **AND** the player exposes a direct English subtitle track
- **THEN** the extension disables subtitles for that video

### Requirement: English subtitle policy SHALL attempt to wake a dormant caption renderer

When the extension enables a direct English subtitle track for English audio, it SHALL allow a short grace period for YouTube to render caption text. If the desired English track remains logically active but no rendered caption text appears during that grace period, the extension SHALL attempt a one-time refresh through YouTube's captions UI control. The extension SHALL NOT require rendered caption text after the fallback in order to treat the logical subtitle selection as applied.

#### Scenario: Caption renderer wakes after fallback

- **WHEN** a watch page becomes active for a video whose active audio language is English
- **AND** the player exposes and logically selects a direct English subtitle track
- **AND** no rendered caption text appears during the grace period
- **THEN** the extension attempts one refresh through YouTube's captions UI control for that video

#### Scenario: Caption text appears during grace period

- **WHEN** a watch page becomes active for a video whose active audio language is English
- **AND** the player exposes and logically selects a direct English subtitle track
- **AND** rendered caption text appears during the grace period
- **THEN** the extension does not perform the captions UI refresh fallback

#### Scenario: Silent intro has no caption text after fallback

- **WHEN** a watch page becomes active for a video whose active audio language is English
- **AND** the player exposes and logically selects a direct English subtitle track
- **AND** no rendered caption text appears before or after the one-time captions UI refresh
- **THEN** the extension does not continue refreshing captions for that video solely because rendered caption text is absent

#### Scenario: User changes subtitle state during grace period

- **WHEN** the extension has logically selected an English subtitle track for the current confirmed video
- **AND** the user changes subtitle or audio state before the renderer fallback runs
- **THEN** the extension does not perform the captions UI refresh fallback for that video

#### Scenario: Navigation occurs before fallback

- **WHEN** the extension has logically selected an English subtitle track for one video
- **AND** SPA navigation changes the current confirmed video before the renderer fallback runs
- **THEN** the stale fallback does not change subtitle state for the new video

### Requirement: Unavailable English subtitles SHALL leave subtitles off

The extension SHALL leave subtitles disabled when the active audio language is English but no direct English subtitle track can be selected.

#### Scenario: English audio without a direct English track

- **WHEN** a watch page becomes active for a video whose active audio language is English
- **AND** the player does not expose a direct English subtitle track
- **THEN** the extension disables subtitles for that video

### Requirement: Non-English and unknown audio SHALL disable subtitles

The extension SHALL turn subtitles off when the active audio language is not English or cannot be determined.

#### Scenario: Spanish audio video loads with subtitles on

- **WHEN** a watch page becomes active for a video whose active audio language is Spanish and subtitles are currently enabled
- **THEN** the extension disables subtitles for that video

#### Scenario: Other non-English audio video loads with subtitles on

- **WHEN** a watch page becomes active for a video whose active audio language is neither English nor unknown and subtitles are currently enabled
- **THEN** the extension disables subtitles for that video

#### Scenario: Unknown audio language video loads with subtitles on

- **WHEN** a watch page becomes active for a video whose active audio language cannot be determined and subtitles are currently enabled
- **THEN** the extension disables subtitles for that video

#### Scenario: Unknown audio language video loads with subtitles off

- **WHEN** a watch page becomes active for a video whose active audio language cannot be determined and subtitles are already disabled
- **THEN** the extension leaves subtitles off without showing any UI

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
