## MODIFIED Requirements

### Requirement: Watch-page subtitle policy SHALL use the active audio language

The extension SHALL determine subtitle policy for a YouTube watch page from the active player audio language, using the live player state for the current confirmed video instead of document language, stale bootstrap data, or arbitrary caption-only metadata. The extension SHALL infer the active audio language from the current player's active audio-track metadata, including current YouTube metadata shapes exposed by `getAudioTrack()`. The extension SHALL treat a missing or unusable active audio language as unknown for subtitle policy decisions unless the player exposes a direct English auto-generated caption track that strongly indicates English active audio. The extension SHALL NOT use arbitrary manual English caption tracks alone to infer English active audio.

#### Scenario: Active audio track reports English

- **WHEN** the current confirmed watch page's active player audio track reports an English language code
- **THEN** the extension treats the video as English-audio content for subtitle policy decisions

#### Scenario: Active audio track reports English in current YouTube metadata shape

- **WHEN** the current confirmed watch page's active player audio track reports English metadata through the current YouTube audio-track metadata shape
- **THEN** the extension treats the video as English-audio content for subtitle policy decisions

#### Scenario: Active audio track reports Spanish

- **WHEN** the current confirmed watch page's active player audio track reports a Spanish language code
- **THEN** the extension treats the video as non-English-audio content for subtitle policy decisions

#### Scenario: Active audio track is undefined

- **WHEN** the current confirmed watch page's active audio track does not expose a usable language code
- **AND** the player does not expose a direct English auto-generated caption track
- **THEN** the extension treats the audio language as unknown and does not activate subtitles from caption metadata alone

#### Scenario: Caption tracks report manual English but active audio language is unknown

- **WHEN** the current confirmed watch page's active audio track does not expose a usable language code
- **AND** the player exposes a direct English caption track that is not auto-generated
- **THEN** the extension treats the audio language as unknown and does not activate subtitles from caption metadata alone

#### Scenario: Auto-generated English caption track exists but active audio language is non-English

- **WHEN** the current confirmed watch page's active player audio track reports a non-English language code
- **AND** the player exposes a direct English auto-generated caption track
- **THEN** the extension treats the video as non-English-audio content for subtitle policy decisions

#### Scenario: Auto-generated English caption track exists and active audio language is unknown

- **WHEN** the current confirmed watch page's active audio track does not expose a usable language code
- **AND** the player exposes a direct English auto-generated caption track
- **THEN** the extension treats the video as English-audio content for subtitle policy decisions

#### Scenario: URL and player video IDs do not match during SPA navigation

- **WHEN** the URL `v` query parameter identifies a watch video
- **AND** the live player or bridge reports a different video ID
- **THEN** the extension does not apply subtitle policy until the live player confirms the current URL video ID
