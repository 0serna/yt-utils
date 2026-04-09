# youtube-watch-marking-extension Specification

## Purpose
TBD - created by archiving change add-youtube-mark-as-seen-extension. Update Purpose after archive.
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

### Requirement: Extension automates the watch-completion share flow in order
The extension SHALL perform the requested YouTube interactions in this order: seek the current video to 99% progress, pause the video, open the Share dialog, enable `Start at`, and trigger the Copy URL action. The background service worker SHALL use the `yt-utils:inline-trigger` message type for inline trigger communication.

#### Scenario: Successful ordered automation
- **WHEN** the user starts the extension on a supported watch page and all required YouTube controls are available
- **THEN** the extension performs each step in the specified order and uses the `yt-utils:` prefix for all internal message types

#### Scenario: Required control is unavailable
- **WHEN** a required player or share-dialog control cannot be found or activated during the automation
- **THEN** the extension stops the sequence and reports a failure instead of continuing with partial actions

### Requirement: Extension redirects the tab to the generated share URL
After enabling `Start at`, the extension SHALL obtain the share URL that reflects the selected start time, trigger the Copy URL action, and redirect the current tab to that generated URL.

#### Scenario: Redirect uses generated start-time URL
- **WHEN** the `Start at` option is enabled and the share dialog produces an updated URL
- **THEN** the extension redirects the current tab to that generated URL after triggering the copy action

#### Scenario: Generated URL is unavailable
- **WHEN** the share dialog does not expose a valid generated URL after `Start at` is enabled
- **THEN** the extension does not redirect the tab and reports that the share URL could not be obtained
