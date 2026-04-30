## MODIFIED Requirements

### Requirement: Watch-page subtitle policy SHALL disable subtitles by default

The extension SHALL disable subtitles when a supported YouTube watch page becomes active, regardless of active audio language, available caption tracks, translation availability, or internal refactoring of player snapshot and bridge code.

#### Scenario: Watch page loads with subtitles on

- **WHEN** a supported watch page becomes active for a video whose subtitles are currently enabled
- **THEN** the extension disables subtitles for that video

#### Scenario: Watch page loads with subtitles already off

- **WHEN** a supported watch page becomes active for a video whose subtitles are already disabled
- **THEN** the extension leaves subtitles off without showing any UI

### Requirement: Automatic subtitle policy SHALL not select caption tracks

The extension SHALL NOT automatically enable subtitles or select a direct or translated caption track during watch-page policy application.

#### Scenario: Direct English captions are available

- **WHEN** a supported watch page becomes active for a video that exposes a direct English subtitle track
- **THEN** the extension leaves subtitles off and does not automatically select that track

#### Scenario: Only translatable captions are available

- **WHEN** a supported watch page becomes active for a video that lacks a direct English subtitle track but exposes a caption track that can be translated to English
- **THEN** the extension leaves subtitles off and does not automatically select English auto-translation
