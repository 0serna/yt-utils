## MODIFIED Requirements

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

### Requirement: Non-Spanish audio SHALL prefer direct English subtitles

The extension SHALL enable subtitles only for English audio and select a direct English subtitle track when one is available.

#### Scenario: Direct English track exists for English audio

- **WHEN** a watch page becomes active for a video whose active audio language is English
- **AND** the player exposes a direct English subtitle track
- **THEN** the extension enables subtitles and selects the direct English track

#### Scenario: Direct English track exists for non-English audio

- **WHEN** a watch page becomes active for a video whose active audio language is not English
- **AND** the player exposes a direct English subtitle track
- **THEN** the extension disables subtitles for that video

### Requirement: Unavailable English subtitles SHALL leave subtitles off

The extension SHALL leave subtitles disabled when the active audio language is English but no direct English subtitle track can be selected.

#### Scenario: English audio without a direct English track

- **WHEN** a watch page becomes active for a video whose active audio language is English
- **AND** the player does not expose a direct English subtitle track
- **THEN** the extension disables subtitles for that video

## ADDED Requirements

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

## REMOVED Requirements

### Requirement: Non-Spanish audio SHALL fall back to auto-translated English

**Reason**: Subtitle activation is now restricted to confirmed English audio with a direct English subtitle track. Auto-translation is no longer part of the automatic subtitle policy.

**Migration**: Videos that previously received English auto-translation automatically will now have subtitles disabled unless the user manually enables subtitles for that video.
