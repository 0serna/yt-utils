## ADDED Requirements

### Requirement: Unknown audio language SHALL leave subtitles off

The extension SHALL leave subtitles disabled when the live player state cannot resolve the current video's audio language after the supported inference steps have been attempted.

#### Scenario: Audio language cannot be inferred

- **WHEN** a watch page becomes active and the extension cannot resolve the current video's audio language from the active player state
- **THEN** the extension leaves subtitles disabled for that video

## MODIFIED Requirements

### Requirement: Spanish audio SHALL disable subtitles

The extension SHALL turn subtitles off when the active audio language is Spanish or English.

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

### Requirement: Non-Spanish audio SHALL prefer direct English subtitles

The extension SHALL enable subtitles and select a direct English subtitle track only when the active audio language is neither Spanish nor English.

#### Scenario: Direct English track exists

- **WHEN** a watch page becomes active for a video whose active audio language is neither Spanish nor English and the player exposes a direct English subtitle track
- **THEN** the extension enables subtitles and selects the direct English track

### Requirement: Non-Spanish audio SHALL fall back to auto-translated English

The extension SHALL select auto-translated English subtitles only when the audio language is neither Spanish nor English, no direct English subtitle track is available, and an available subtitle track can be translated to English.

#### Scenario: Direct English track is missing but English translation is available

- **WHEN** a watch page becomes active for a video whose active audio language is neither Spanish nor English, no direct English subtitle track exists, and the available subtitle track can be translated to English
- **THEN** the extension enables subtitles and selects English auto-translation

### Requirement: Unavailable English subtitles SHALL leave subtitles off

The extension SHALL leave subtitles disabled when the active audio language is neither Spanish nor English but neither direct English subtitles nor English auto-translation can be selected.

#### Scenario: No route to English subtitles exists

- **WHEN** a watch page becomes active for a video whose active audio language is neither Spanish nor English and the player cannot provide either direct English subtitles or English auto-translation
- **THEN** the extension disables subtitles for that video
