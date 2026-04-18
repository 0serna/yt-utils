# youtube-subscriptions-feed-controls Specification

## Purpose
Inline controls that augment supported subscriptions-feed video cards while delegating actions to YouTube's native UI.

## Requirements

### Requirement: Extension removes the Shorts shelf from the subscriptions feed
The extension SHALL detect and remove the Shorts shelf section from the desktop `www.youtube.com/feed/subscriptions` page. The Shorts shelf is identified by the `ytd-rich-shelf-renderer` element with the `is-shorts` attribute.

#### Scenario: Shorts shelf is removed on page load
- **WHEN** the user opens the desktop subscriptions feed and a Shorts shelf section is present
- **THEN** the extension removes the Shorts shelf's parent `ytd-rich-section-renderer` from the DOM

#### Scenario: Shorts shelf is removed after SPA navigation
- **WHEN** the user navigates into `www.youtube.com/feed/subscriptions` through YouTube's SPA navigation
- **THEN** the extension removes the Shorts shelf section if present

#### Scenario: Shorts shelf is removed after feed rerender
- **WHEN** YouTube dynamically re-renders the subscriptions feed and the Shorts shelf reappears
- **THEN** the extension removes the Shorts shelf section again

#### Scenario: Non-subscriptions pages are not affected
- **WHEN** the user is on any YouTube page other than the desktop subscriptions feed
- **THEN** the extension does not attempt to remove any Shorts-related elements

#### Scenario: Regular video cards are not affected
- **WHEN** the extension removes the Shorts shelf from the subscriptions feed
- **THEN** all regular video cards in the feed remain visible and functional
