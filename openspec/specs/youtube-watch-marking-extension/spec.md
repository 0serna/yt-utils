# youtube-watch-marking-extension Specification

## Purpose

Provide a single-click Chrome extension for supported YouTube watch pages that automates the share-link flow to mark the current video as seen.

## Requirements

### Requirement: Action runs only on supported YouTube watch pages

The extension SHALL start the mark-as-seen automation only when the user activates either the extension action or the inline desktop watch-page button while the current tab is a supported standard YouTube watch page URL. The implementation SHALL live in `src/features/mark-as-seen/background.ts` for the service worker handler and `src/features/mark-as-seen/content.ts` for the inline trigger logic.

#### Scenario: User clicks extension action on a watch page

- **WHEN** the active tab URL is a supported `youtube.com/watch` video page and the user clicks the extension action
- **THEN** the background handler in `src/features/mark-as-seen/background.ts` starts the mark-as-seen automation for that tab

#### Scenario: User clicks inline button on a watch page

- **WHEN** the current page is a supported desktop `www.youtube.com/watch` video page and the user clicks the inline check button managed by `src/features/mark-as-seen/content.ts`
- **THEN** the content feature sends the `yt-utils:inline-trigger` message and the background handler starts the mark-as-seen automation for that tab

#### Scenario: User triggers the extension on an unsupported page

- **WHEN** the current tab is not a supported YouTube watch page and the user activates an available extension trigger
- **THEN** the extension does not run the automation and reports that the page is unsupported

### Requirement: Extension shows an inline desktop watch-page trigger next to Like

The extension SHALL render an icon-only inline check button on supported desktop `www.youtube.com/watch` pages and place it immediately after the Like button when a compatible anchor is available in the YouTube action row. The button's DOM IDs SHALL use the `yt-utils-` prefix (e.g. `yt-utils-inline-host`, `yt-utils-inline-button`).

#### Scenario: Inline trigger appears on supported desktop watch page

- **WHEN** the user opens a supported desktop YouTube watch page and the action row finishes rendering
- **THEN** the extension displays a single icon-only check button integrated into the action row near the Like button with DOM IDs using the `yt-utils-` prefix

#### Scenario: Preferred Like anchor is unavailable but action row exists

- **WHEN** the page exposes a compatible desktop watch-page action row but the exact Like-button adjacency cannot be used
- **THEN** the extension still displays a single inline check button within the same action row using `yt-utils-` prefixed IDs

#### Scenario: Unsupported YouTube surface

- **WHEN** the user is on a non-desktop or non-watch YouTube surface
- **THEN** the extension does not render the inline check button

### Requirement: Inline trigger remains visible and reflects execution state

When the inline check button is used, the extension SHALL keep that button visible in the watch-page action row during execution and SHALL reflect minimal running, success, and failure states on the button itself. The button label strings SHALL reference the "YT Utils" project name in tooltips and accessible labels.

#### Scenario: Inline trigger shows running state

- **WHEN** the user clicks the inline check button and the automation is in progress
- **THEN** the same button remains visible in place and reflects that it is running with a label referencing "YT Utils"

#### Scenario: Inline trigger shows success state

- **WHEN** the automation started from the inline check button completes successfully
- **THEN** the same button reflects a success state without opening a separate popup or settings surface

#### Scenario: Inline trigger shows failure state

- **WHEN** the automation started from the inline check button fails
- **THEN** the same button reflects a failure state with a label referencing "YT Utils"

### Requirement: Extension automates the watch-completion flow in order

The extension SHALL perform the requested YouTube interactions in this order: seek the current video to 99% progress, play briefly to trigger YouTube's heartbeat signal, and pause the video. The background service worker SHALL use the `yt-utils:inline-trigger` message type for inline trigger communication.

#### Scenario: Successful ordered automation

- **WHEN** the user starts the extension on a supported watch page and all required YouTube controls are available
- **THEN** the extension performs each step in the specified order, including a brief playback step after seeking, and uses the `yt-utils:` prefix for all internal message types

#### Scenario: Required control is unavailable

- **WHEN** a required player control cannot be found or activated during the automation
- **THEN** the extension stops the sequence and reports a failure instead of continuing with partial actions

#### Scenario: Playback triggers heartbeat for watched state

- **WHEN** the extension seeks to 99% and plays the video briefly before pausing
- **THEN** YouTube's heartbeat signal fires, causing the server to register the video as watched and display the red progress bar on thumbnails

### Requirement: Extension shows an inline desktop watch-page playback speed control

The extension SHALL render a single inline playback-speed control on supported desktop `www.youtube.com/watch` pages near the existing inline action area.
The control SHALL display decrement and increment buttons plus the current speed as visible text with an `x` suffix.
The control SHALL use `0.05` increments, clamp values to `0.50x` through `2.00x`, disable the button at the matching bound, and reflect the current video's initialized playback speed.

#### Scenario: Supported desktop watch page renders the playback speed control

- **WHEN** the user opens a supported desktop YouTube watch page and the action row finishes rendering
- **THEN** the extension displays a single inline playback-speed control in that row with visible current-speed text and `-` / `+` controls

#### Scenario: Playback speed reaches lower bound

- **WHEN** the current saved or selected playback speed is `0.50x`
- **THEN** the decrement button is disabled and the increment button remains available

#### Scenario: Playback speed reaches upper bound

- **WHEN** the current saved or selected playback speed is `2.00x`
- **THEN** the increment button is disabled and the decrement button remains available

#### Scenario: Unsupported YouTube surface does not render playback speed control

- **WHEN** the user is on a non-desktop or non-watch YouTube surface
- **THEN** the extension does not render the inline playback-speed control

### Requirement: Extension applies and persists a global playback speed preference

The extension SHALL apply playback-speed changes immediately to the current watch page by setting the active `HTMLVideoElement.playbackRate` directly.
Each supported watch page SHALL initialize playback speed independently for the current video instead of loading a saved global default.
The initial speed SHALL be `1.00x`, the extension SHALL keep it at `1.00x` when the current video's inferred audio language is English, and it SHALL change it to `1.10x` when the inferred audio language is Spanish.
Manual changes made with the inline playback-speed control SHALL apply only to the current video and SHALL NOT become the default for future videos, future tabs, or later watch-page navigations.

#### Scenario: English audio video loads

- **WHEN** a supported watch page becomes active for a video whose inferred audio language is English and the user has not changed the playback speed yet
- **THEN** the extension applies `1.00x` to that video's player and reflects `1.00x` in the inline control

#### Scenario: Spanish audio video loads

- **WHEN** a supported watch page becomes active for a video whose inferred audio language is Spanish and the user has not changed the playback speed yet
- **THEN** the extension applies `1.10x` to that video's player and reflects `1.10x` in the inline control

#### Scenario: Other language video loads

- **WHEN** a supported watch page becomes active for a video whose inferred audio language is neither English nor Spanish and the user has not changed the playback speed yet
- **THEN** the extension applies `1.00x` to that video's player and reflects `1.00x` in the inline control

#### Scenario: Audio language cannot be inferred

- **WHEN** a supported watch page becomes active for a video whose audio language cannot be inferred and the user has not changed the playback speed yet
- **THEN** the extension keeps playback speed at `1.00x` and reflects `1.00x` in the inline control

#### Scenario: User changes playback speed on the current video

- **WHEN** the user activates the increment or decrement button on a supported desktop watch page
- **THEN** the extension updates the current page's playback speed immediately and keeps that manual value only for the current video

#### Scenario: Future watch page re-evaluates its own language default

- **WHEN** a supported watch page is opened or navigated to after the user previously changed playback speed on another video
- **THEN** the extension ignores the prior video's manual speed and initializes the new video's speed from its own language-based default
