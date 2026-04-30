## MODIFIED Requirements

### Requirement: Action runs only on supported YouTube watch pages

The extension SHALL start the mark-as-seen automation only when the user activates either the extension action or the inline desktop watch-page button while the current tab is a supported standard YouTube watch page URL. The background service worker SHALL validate the active tab and request automation from the YouTube content script instead of injecting a serialized automation function.

#### Scenario: User clicks extension action on a watch page

- **WHEN** the active tab URL is a supported `youtube.com/watch` video page and the user clicks the extension action
- **THEN** the background handler in `src/features/mark-as-seen/background.ts` requests mark-as-seen automation from the content script for that tab

#### Scenario: User clicks inline button on a watch page

- **WHEN** the current page is a supported desktop `www.youtube.com/watch` video page and the user clicks the inline check button managed by `src/features/mark-as-seen/content.ts`
- **THEN** the content feature sends the `yt-utils:inline-trigger` message and the background handler requests mark-as-seen automation from the content script for that tab

#### Scenario: User triggers the extension on an unsupported page

- **WHEN** the current tab is not a supported YouTube watch page and the user activates an available extension trigger
- **THEN** the extension does not run the automation and reports that the page is unsupported

### Requirement: Extension automates the watch-completion flow in order

The extension SHALL perform the requested YouTube interactions in this order: seek the current video to 99% progress, play briefly to trigger YouTube's heartbeat signal, and pause the video. Internal automation requests SHALL use `yt-utils:` prefixed message types and execute from content-script code that can import shared helpers.

#### Scenario: Successful ordered automation

- **WHEN** the user starts the extension on a supported watch page and all required YouTube controls are available
- **THEN** the extension performs each step in the specified order, including a brief playback step after seeking, and uses the `yt-utils:` prefix for all internal message types

#### Scenario: Required control is unavailable

- **WHEN** a required player control cannot be found or activated during the automation
- **THEN** the extension stops the sequence and reports a failure instead of continuing with partial actions

#### Scenario: Playback triggers heartbeat for watched state

- **WHEN** the extension seeks to 99% and plays the video briefly before pausing
- **THEN** YouTube's heartbeat signal fires, causing the server to register the video as watched and display the red progress bar on thumbnails
