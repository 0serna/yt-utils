## MODIFIED Requirements

### Requirement: Extension removes the Shorts shelf from the subscriptions feed
The extension SHALL detect and remove Shorts shelf sections from supported desktop YouTube feed pages, specifically `www.youtube.com/feed/subscriptions` and `www.youtube.com/`. Each Shorts shelf is identified by the `ytd-rich-shelf-renderer` element with the `is-shorts` attribute.

#### Scenario: Shorts shelf is removed on subscriptions page load
- **WHEN** the user opens the desktop subscriptions feed and a Shorts shelf section is present
- **THEN** the extension removes the Shorts shelf's parent `ytd-rich-section-renderer` from the DOM

#### Scenario: Shorts shelf is removed on home page load
- **WHEN** the user opens the desktop home feed and a Shorts shelf section is present
- **THEN** the extension removes the Shorts shelf's parent `ytd-rich-section-renderer` from the DOM

#### Scenario: Shorts shelf is removed after SPA navigation to subscriptions
- **WHEN** the user navigates into `www.youtube.com/feed/subscriptions` through YouTube's SPA navigation
- **THEN** the extension removes each Shorts shelf section present on the page

#### Scenario: Shorts shelf is removed after SPA navigation to home
- **WHEN** the user navigates into `www.youtube.com/` through YouTube's SPA navigation
- **THEN** the extension removes each Shorts shelf section present on the page

#### Scenario: Shorts shelf is removed after feed rerender
- **WHEN** YouTube dynamically re-renders a supported desktop feed page and one or more Shorts shelf sections reappear
- **THEN** the extension removes each Shorts shelf section again

#### Scenario: Unsupported pages are not affected
- **WHEN** the user is on any YouTube page other than the desktop subscriptions feed or desktop home feed
- **THEN** the extension does not attempt to remove any Shorts-related elements

#### Scenario: Regular video cards are not affected
- **WHEN** the extension removes Shorts shelf sections from a supported desktop feed page
- **THEN** all regular video cards in the feed remain visible and functional
