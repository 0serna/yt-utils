# audio-language-subtitle-policy Specification

## Purpose

Define subtitle policy for YouTube watch pages as a universal default-off behavior.

## Requirements

### Requirement: Watch-page subtitle policy SHALL disable subtitles by default

The extension SHALL disable subtitles when a supported YouTube watch page becomes active, regardless of active audio language, available caption tracks, or translation availability.

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

### Requirement: Manual per-video overrides SHALL be respected

After the extension applies its default-off subtitle policy for a video, it SHALL stop reapplying the policy for that same video if the user manually changes subtitle or audio behavior.

#### Scenario: User turns subtitles on after policy disabled them

- **WHEN** the extension has already disabled subtitles for the current video and the user manually enables subtitles
- **THEN** the extension does not turn subtitles off again for that video

#### Scenario: User chooses a different subtitle or audio track

- **WHEN** the extension has already applied subtitle policy for the current video and the user manually selects a different subtitle track or audio track
- **THEN** the extension does not reapply its default-off selection again for that video

### Requirement: Subtitle policy SHALL stay silent

The extension SHALL apply subtitle policy without adding visible controls, prompts, notifications, or other new user-facing UI.

#### Scenario: Policy runs on watch page activation

- **WHEN** the extension evaluates subtitle policy for a watch page
- **THEN** it applies the result without adding any new visible interface elements
