## ADDED Requirements

### Requirement: Extension removes the Most relevant shelf from subscriptions

The extension SHALL detect and remove the `Most relevant` shelf section from the desktop `www.youtube.com/feed/subscriptions` page. The removed section SHALL include all videos inside that shelf and its `Show more` / `Show less` controls.

#### Scenario: Most relevant shelf is removed on subscriptions page load

- **WHEN** the user opens the desktop subscriptions feed and a `Most relevant` shelf section is present
- **THEN** the extension removes that shelf's parent section from the DOM

#### Scenario: Show more control in Most relevant shelf is removed

- **WHEN** the user opens the desktop subscriptions feed and the `Most relevant` shelf exposes a `Show more` control
- **THEN** the `Show more` control is no longer visible because the containing shelf section is removed

### Requirement: Extension preserves chronological subscriptions feed items

The extension SHALL leave regular subscriptions feed video cards visible and functional when removing the `Most relevant` shelf.

#### Scenario: Regular subscription cards remain visible

- **WHEN** the extension removes the `Most relevant` shelf from the desktop subscriptions feed
- **THEN** regular chronological `ytd-rich-item-renderer` video cards outside that shelf remain in the DOM

### Requirement: Most relevant removal remains stable across rerenders

The extension SHALL re-apply `Most relevant` shelf removal after YouTube SPA navigation or dynamic feed rerenders on the desktop subscriptions feed.

#### Scenario: SPA navigation into subscriptions removes shelf

- **WHEN** the user navigates into `www.youtube.com/feed/subscriptions` through YouTube's SPA navigation and a `Most relevant` shelf is present
- **THEN** the extension removes the `Most relevant` shelf section

#### Scenario: Feed rerender removes reinserted shelf

- **WHEN** YouTube dynamically rerenders the subscriptions feed and reinserts a `Most relevant` shelf section
- **THEN** the extension removes the reinserted shelf section again

### Requirement: Most relevant removal is scoped to subscriptions

The extension SHALL NOT remove `Most relevant` or other rich shelf sections on unsupported YouTube pages.

#### Scenario: Unsupported page is not modified

- **WHEN** the user is on any YouTube page other than the desktop subscriptions feed
- **THEN** the extension does not attempt to remove `Most relevant` shelf sections
