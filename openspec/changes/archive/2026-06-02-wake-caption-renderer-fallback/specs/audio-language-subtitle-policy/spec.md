## ADDED Requirements

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
