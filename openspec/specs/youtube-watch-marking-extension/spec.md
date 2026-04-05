# youtube-watch-marking-extension Specification

## Purpose
TBD - created by archiving change add-youtube-mark-as-seen-extension. Update Purpose after archive.
## Requirements
### Requirement: Action runs only on supported YouTube watch pages
The extension SHALL start the mark-as-seen automation only when the user clicks the extension action while the active tab is a standard YouTube watch page URL.

#### Scenario: User clicks action on a watch page
- **WHEN** the active tab URL is a supported `youtube.com/watch` video page and the user clicks the extension action
- **THEN** the extension starts the mark-as-seen automation for that tab

#### Scenario: User clicks action on an unsupported page
- **WHEN** the active tab is not a supported YouTube watch page
- **THEN** the extension does not run the automation and reports that the page is unsupported

### Requirement: Extension automates the watch-completion share flow in order
The extension SHALL perform the requested YouTube interactions in this order: seek the current video to 99% progress, pause the video, open the Share dialog, enable `Start at`, and trigger the Copy URL action.

#### Scenario: Successful ordered automation
- **WHEN** the user starts the extension on a supported watch page and all required YouTube controls are available
- **THEN** the extension performs each step in the specified order without skipping intermediate actions

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

