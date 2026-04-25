## MODIFIED Requirements

### Requirement: Overlay works with dynamic feed updates

The extension SHALL apply opacity dimming to eligible video cards that appear dynamically in the subscriptions feed through YouTube's SPA navigation, infinite scroll, or delayed hydration of watched-progress indicators inside existing cards.

#### Scenario: Newly loaded cards show overlay if eligible

- **WHEN** the user scrolls or YouTube loads more content and new video cards appear in the subscriptions feed
- **THEN** the extension applies dimming to any newly visible cards that meet the 80% watch threshold

#### Scenario: Existing card dims after watched progress indicator is inserted

- **WHEN** YouTube inserts a watched-progress indicator into an existing subscriptions feed card and the progress is 80% or higher
- **THEN** the extension applies `opacity: 0.4` to that card's `yt-lockup-view-model` without requiring a page reload

#### Scenario: Existing card dims after watched progress width is updated

- **WHEN** YouTube updates an existing watched-progress indicator from below 80% to 80% or higher in a subscriptions feed card
- **THEN** the extension applies `opacity: 0.4` to that card's `yt-lockup-view-model` without requiring user scrolling or navigation
