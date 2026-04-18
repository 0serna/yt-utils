## MODIFIED Requirements

### Requirement: Extension automates the watch-completion share flow in order

The extension SHALL perform the requested YouTube interactions in this order: seek the current video to 99% progress, play briefly to trigger YouTube's heartbeat signal, pause the video, open the Share dialog, enable `Start at`, and trigger the Copy URL action. The background service worker SHALL use the `yt-utils:inline-trigger` message type for inline trigger communication.

#### Scenario: Successful ordered automation

- **WHEN** the user starts the extension on a supported watch page and all required YouTube controls are available
- **THEN** the extension performs each step in the specified order, including a brief playback step after seeking, and uses the `yt-utils:` prefix for all internal message types

#### Scenario: Required control is unavailable

- **WHEN** a required player or share-dialog control cannot be found or activated during the automation
- **THEN** the extension stops the sequence and reports a failure instead of continuing with partial actions

#### Scenario: Playback triggers heartbeat for watched state

- **WHEN** the extension seeks to 99% and plays the video briefly before pausing
- **THEN** YouTube's heartbeat signal fires, causing the server to register the video as watched and display the red progress bar on thumbnails
