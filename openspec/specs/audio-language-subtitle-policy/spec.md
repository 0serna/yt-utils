# audio-language-subtitle-policy Specification

## Purpose
Define subtitle policy for YouTube watch pages based on the active player audio language and live player state.

## Requirements
### Requirement: Watch-page subtitle policy SHALL use the active audio language
The extension SHALL determine subtitle policy for a YouTube watch page from the active player audio language, using the live player state for the current video instead of document language or stale bootstrap data.

#### Scenario: Active audio track reports Spanish
- **WHEN** the current watch page's active player audio track reports a Spanish language code
- **THEN** the extension treats the video as Spanish-audio content for subtitle policy decisions

#### Scenario: Active audio track is undefined
- **WHEN** the current watch page's active player audio track does not expose a usable language code
- **THEN** the extension falls back to current-video caption metadata from the live player state before deciding the subtitle policy

### Requirement: English and Spanish audio SHALL disable subtitles
The extension SHALL leave subtitles off when the active audio language is English or Spanish.

#### Scenario: Spanish audio video loads with subtitles on
- **WHEN** a watch page becomes active for a video whose active audio language is Spanish and subtitles are currently enabled
- **THEN** the extension disables subtitles for that video

#### Scenario: Spanish audio video loads with subtitles off
- **WHEN** a watch page becomes active for a video whose active audio language is Spanish and subtitles are already disabled
- **THEN** the extension leaves subtitles off without showing any UI

#### Scenario: English audio video loads with subtitles on
- **WHEN** a watch page becomes active for a video whose active audio language is English and subtitles are currently enabled
- **THEN** the extension disables subtitles for that video

#### Scenario: English audio video loads with subtitles off
- **WHEN** a watch page becomes active for a video whose active audio language is English and subtitles are already disabled
- **THEN** the extension leaves subtitles off without showing any UI

### Requirement: Non-English, non-Spanish audio SHALL prefer direct English subtitles
The extension SHALL enable subtitles and select a direct English subtitle track only when the active audio language is neither Spanish nor English.

#### Scenario: Direct English track exists
- **WHEN** a watch page becomes active for a video whose active audio language is neither Spanish nor English and the player exposes a direct English subtitle track
- **THEN** the extension enables subtitles and selects the direct English track

### Requirement: Non-English, non-Spanish audio SHALL fall back to auto-translated English
The extension SHALL select auto-translated English subtitles only when the audio language is neither Spanish nor English, no direct English subtitle track is available, and an available subtitle track can be translated to English.

#### Scenario: Direct English track is missing but English translation is available
- **WHEN** a watch page becomes active for a video whose active audio language is neither Spanish nor English, no direct English subtitle track exists, and the available subtitle track can be translated to English
- **THEN** the extension enables subtitles and selects English auto-translation

### Requirement: Unknown audio language SHALL leave subtitles off
The extension SHALL leave subtitles disabled when the live player state cannot resolve the current video's audio language after the supported inference steps have been attempted.

#### Scenario: Audio language cannot be inferred
- **WHEN** a watch page becomes active and the extension cannot resolve the current video's audio language from the active player state
- **THEN** the extension leaves subtitles disabled for that video

### Requirement: Manual per-video overrides SHALL be respected
After the extension applies subtitle policy for a video, it SHALL stop reapplying the policy for that same video if the user manually changes subtitle or audio behavior.

#### Scenario: User turns subtitles off after policy enabled them
- **WHEN** the extension has already enabled English subtitles for the current video and the user manually disables subtitles
- **THEN** the extension does not re-enable subtitles again for that video

#### Scenario: User chooses a different subtitle or audio track
- **WHEN** the extension has already applied subtitle policy for the current video and the user manually selects a different subtitle track or audio track
- **THEN** the extension does not reapply its preferred subtitle selection again for that video

### Requirement: Subtitle policy SHALL stay silent
The extension SHALL apply subtitle policy without adding visible controls, prompts, notifications, or other new user-facing UI.

#### Scenario: Policy runs on watch page activation
- **WHEN** the extension evaluates subtitle policy for a watch page
- **THEN** it applies the result without adding any new visible interface elements
