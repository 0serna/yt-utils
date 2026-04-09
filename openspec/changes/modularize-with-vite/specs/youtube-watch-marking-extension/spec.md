## MODIFIED Requirements

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