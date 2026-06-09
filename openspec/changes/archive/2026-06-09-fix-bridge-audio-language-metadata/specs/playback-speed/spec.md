## MODIFIED Requirements

### Requirement: Extension applies and persists a per-video playback speed preference

The extension SHALL apply playback-speed changes immediately to the current confirmed watch page by setting the active `HTMLVideoElement.playbackRate` directly. Each supported watch page video session SHALL initialize playback speed independently for the current confirmed video instead of loading a saved global default or reusing state from a prior SPA video. The initial speed SHALL be `1.00x`, the extension SHALL change it to `0.95x` when the current video's inferred audio language is English, and it SHALL change it to `1.10x` when the inferred audio language is Spanish. Language-aware initialization SHALL infer audio language from the current player's active audio-track metadata, including current YouTube metadata shapes exposed by `getAudioTrack()`. The extension SHALL recognize active audio language exposed through the `US` audio-track metadata shape. The extension SHALL treat opaque or non-language active audio IDs as unknown instead of using them as inferred audio language. When the active audio language cannot be inferred from active audio-track metadata, the extension SHALL infer English or Spanish only from direct auto-generated caption tracks for those languages, such as tracks with `kind: "asr"` or ASR-style `vssId` values. The extension SHALL NOT infer playback-speed language from arbitrary manual, translated, or non-ASR caption-track metadata. Manual changes made with the inline playback-speed control SHALL apply only to the current video and SHALL NOT become the default for future videos, future tabs, or later watch-page navigations.

#### Scenario: English audio video loads

- **WHEN** a supported watch page becomes active for a confirmed video whose inferred audio language is English and the user has not changed the playback speed yet
- **THEN** the extension applies `0.95x` to that video's player and reflects `0.95x` in the inline control

#### Scenario: English audio video reports current YouTube metadata shape

- **WHEN** a supported watch page becomes active for a confirmed video whose active audio track reports English metadata through the current YouTube audio-track metadata shape
- **AND** the user has not changed the playback speed yet
- **THEN** the extension applies `0.95x` to that video's player and reflects `0.95x` in the inline control

#### Scenario: Spanish audio video loads

- **WHEN** a supported watch page becomes active for a confirmed video whose inferred audio language is Spanish and the user has not changed the playback speed yet
- **THEN** the extension applies `1.10x` to that video's player and reflects `1.10x` in the inline control

#### Scenario: Spanish audio video reports current YouTube metadata shape

- **WHEN** a supported watch page becomes active for a confirmed video whose active audio track reports Spanish metadata through the current YouTube audio-track metadata shape
- **AND** the user has not changed the playback speed yet
- **THEN** the extension applies `1.10x` to that video's player and reflects `1.10x` in the inline control

#### Scenario: Spanish audio video reports US metadata shape

- **WHEN** a supported watch page becomes active for a confirmed video whose active audio track reports Spanish metadata through the `US` YouTube audio-track metadata shape
- **AND** the user has not changed the playback speed yet
- **THEN** the extension applies `1.10x` to that video's player and reflects `1.10x` in the inline control

#### Scenario: Opaque top-level audio ID with Spanish metadata shape

- **WHEN** a supported watch page becomes active for a confirmed video whose active audio track exposes an opaque top-level ID
- **AND** the active audio track exposes a Spanish language code through a recognized metadata shape
- **AND** the user has not changed the playback speed yet
- **THEN** the extension applies `1.10x` to that video's player and reflects `1.10x` in the inline control

#### Scenario: Opaque active audio ID with Spanish ASR fallback

- **WHEN** a supported watch page becomes active for a confirmed video whose active audio language cannot be inferred because audio-track IDs are opaque or non-language values
- **AND** the player exposes a direct Spanish auto-generated caption track
- **AND** the user has not changed the playback speed yet
- **THEN** the extension applies `1.10x` to that video's player and reflects `1.10x` in the inline control

#### Scenario: Other language video loads

- **WHEN** a supported watch page becomes active for a confirmed video whose inferred audio language is neither English nor Spanish and the user has not changed the playback speed yet
- **THEN** the extension applies `1.00x` to that video's player and reflects `1.00x` in the inline control

#### Scenario: Caption tracks report Spanish but active audio language is unknown

- **WHEN** a supported watch page becomes active for a confirmed video whose active audio language cannot be inferred from active audio-track metadata
- **AND** the player exposes a Spanish caption track that is not a direct auto-generated Spanish caption track
- **AND** the user has not changed the playback speed yet
- **THEN** the extension keeps playback speed at `1.00x` and reflects `1.00x` in the inline control

#### Scenario: Unknown audio exposes English auto-generated captions

- **WHEN** a supported watch page becomes active for a confirmed video whose active audio language cannot be inferred from active audio-track metadata
- **AND** the player exposes a direct English auto-generated caption track
- **AND** the user has not changed the playback speed yet
- **THEN** the extension applies `0.95x` to that video's player and reflects `0.95x` in the inline control

#### Scenario: Unknown audio exposes Spanish auto-generated captions

- **WHEN** a supported watch page becomes active for a confirmed video whose active audio language cannot be inferred from active audio-track metadata
- **AND** the player exposes a direct Spanish auto-generated caption track
- **AND** the user has not changed the playback speed yet
- **THEN** the extension applies `1.10x` to that video's player and reflects `1.10x` in the inline control

#### Scenario: Unknown audio exposes English and Spanish auto-generated captions

- **WHEN** a supported watch page becomes active for a confirmed video whose active audio language cannot be inferred from active audio-track metadata
- **AND** the player exposes both direct English and direct Spanish auto-generated caption tracks
- **AND** the user has not changed the playback speed yet
- **THEN** the extension applies `0.95x` to that video's player and reflects `0.95x` in the inline control

#### Scenario: Audio language cannot be inferred

- **WHEN** a supported watch page becomes active for a confirmed video whose audio language cannot be inferred from active audio-track metadata or direct English or Spanish auto-generated caption metadata and the user has not changed the playback speed yet
- **THEN** the extension keeps playback speed at `1.00x` and reflects `1.00x` in the inline control

#### Scenario: User changes playback speed on the current video

- **WHEN** the user activates the increment or decrement button on a supported desktop watch page
- **THEN** the extension updates the current page's playback speed immediately and keeps that manual value only for the current video

#### Scenario: Future watch page re-evaluates its own language default

- **WHEN** a supported watch page is opened or navigated to after the user previously changed playback speed on another video
- **THEN** the extension ignores the prior video's manual speed and initializes the new video's speed from its own language-based default

#### Scenario: Previous video speed work completes after navigation

- **WHEN** playback-speed initialization that started for a previous video completes after SPA navigation to a new video
- **THEN** that stale work does not change the new video's playback speed or control state

#### Scenario: URL and player video IDs do not match during SPA navigation

- **WHEN** the URL `v` query parameter identifies a watch video
- **AND** the live player or bridge reports a different video ID
- **THEN** the extension does not initialize language-based playback speed until the live player confirms the current URL video ID
