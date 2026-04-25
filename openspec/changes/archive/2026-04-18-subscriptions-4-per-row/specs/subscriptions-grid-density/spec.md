## ADDED Requirements

### Requirement: Extension modifies subscriptions feed to show 4 videos per row

The extension SHALL modify the layout of video cards on the desktop `www.youtube.com/feed/subscriptions` page to display 4 cards per row instead of the default 3, by reducing card width from approximately 528px to 400px.

#### Scenario: Grid density is applied on page load

- **WHEN** the user opens the desktop subscriptions feed page
- **THEN** the extension injects CSS to reduce video card width to 400px
- **AND** video cards are arranged 4 per row when container width permits

#### Scenario: Grid density is applied after SPA navigation

- **WHEN** the user navigates to `www.youtube.com/feed/subscriptions` through YouTube's SPA navigation
- **THEN** the extension applies the grid density CSS immediately
- **AND** the 4-per-row layout is visible without page reload

#### Scenario: Video thumbnail aspect ratios are preserved

- **WHEN** the extension reduces video card width to 400px
- **THEN** video thumbnails maintain their original 16:9 aspect ratio
- **AND** no visual distortion occurs

#### Scenario: Non-subscriptions pages are not affected

- **WHEN** the user is on any page other than `www.youtube.com/feed/subscriptions`
- **THEN** the extension does not inject any grid density CSS
- **AND** the page renders with its default layout

#### Scenario: Feature deactivation removes CSS

- **WHEN** the user navigates away from the subscriptions feed page
- **THEN** the extension removes the injected CSS
- **AND** the original 3-per-row layout is restored if the user returns

#### Scenario: Dynamic content updates maintain layout

- **WHEN** YouTube dynamically adds new video cards to the feed (e.g., infinite scroll)
- **THEN** the injected CSS automatically applies to new cards
- **AND** they render at 400px width with 4-per-row arrangement
