## MODIFIED Requirements

### Requirement: Action runs only on supported YouTube watch pages
The extension SHALL start the mark-as-seen automation only when the user activates either the extension action or the inline desktop watch-page button while the current tab is a supported standard YouTube watch page URL.

#### Scenario: User clicks extension action on a watch page
- **WHEN** the active tab URL is a supported `youtube.com/watch` video page and the user clicks the extension action
- **THEN** the extension starts the mark-as-seen automation for that tab

#### Scenario: User clicks inline button on a watch page
- **WHEN** the current page is a supported desktop `www.youtube.com/watch` video page and the user clicks the inline check button
- **THEN** the extension starts the same mark-as-seen automation for that tab

#### Scenario: User triggers the extension on an unsupported page
- **WHEN** the current tab is not a supported YouTube watch page and the user activates an available extension trigger
- **THEN** the extension does not run the automation and reports that the page is unsupported

## ADDED Requirements

### Requirement: Extension shows an inline desktop watch-page trigger next to Like
The extension SHALL render an icon-only inline check button on supported desktop `www.youtube.com/watch` pages and place it immediately after the Like button when a compatible anchor is available in the YouTube action row.

#### Scenario: Inline trigger appears on supported desktop watch page
- **WHEN** the user opens a supported desktop YouTube watch page and the action row finishes rendering
- **THEN** the extension displays a single icon-only check button integrated into the action row near the Like button

#### Scenario: Preferred Like anchor is unavailable but action row exists
- **WHEN** the page exposes a compatible desktop watch-page action row but the exact Like-button adjacency cannot be used
- **THEN** the extension still displays a single inline check button within the same action row

#### Scenario: Unsupported YouTube surface
- **WHEN** the user is on a non-desktop or non-watch YouTube surface
- **THEN** the extension does not render the inline check button

### Requirement: Inline trigger remains visible and reflects execution state
When the inline check button is used, the extension SHALL keep that button visible in the watch-page action row during execution and SHALL reflect minimal running, success, and failure states on the button itself.

#### Scenario: Inline trigger shows running state
- **WHEN** the user clicks the inline check button and the automation is in progress
- **THEN** the same button remains visible in place and reflects that it is running

#### Scenario: Inline trigger shows success state
- **WHEN** the automation started from the inline check button completes successfully
- **THEN** the same button reflects a success state without opening a separate popup or settings surface

#### Scenario: Inline trigger shows failure state
- **WHEN** the automation started from the inline check button fails
- **THEN** the same button reflects a failure state without opening a separate popup or settings surface
