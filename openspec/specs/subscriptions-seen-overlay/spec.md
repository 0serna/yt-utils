# subscriptions-seen-overlay Specification

## Purpose
TBD - created by archiving change subscriptions-seen-overlay. Update Purpose after archive.
## Requirements
### Requirement: Overlay appears on seen video thumbnails
The extension SHALL apply CSS `opacity: 0.4` to the `yt-lockup-view-model` element for any video in the subscriptions feed that has been watched to 80% or more, dimming the entire card including thumbnail, title, channel name, and metadata.

#### Scenario: Seen video shows overlay on page load
- **WHEN** the user opens `www.youtube.com/feed/subscriptions` and a video card has a watch progress of 80% or higher
- **THEN** the extension applies `opacity: 0.4` to the `yt-lockup-view-model` element immediately on page load

#### Scenario: Unwatched video does not show overlay
- **WHEN** the user opens `www.youtube.com/feed/subscriptions` and a video card has a watch progress below 80%
- **THEN** the extension does not modify the opacity of that video's `yt-lockup-view-model`

#### Scenario: Video at exactly 80% shows overlay
- **WHEN** the user opens `www.youtube.com/feed/subscriptions` and a video card has a watch progress of exactly 80%
- **THEN** the extension applies `opacity: 0.4` to that video's `yt-lockup-view-model`

### Requirement: Overlay appears immediately without delay
The extension SHALL apply opacity dimming to eligible video `yt-lockup-view-model` elements immediately upon feature activation, without waiting for any deferred rendering or user interaction.

#### Scenario: Overlay visible before any user scroll
- **WHEN** the user opens `www.youtube.com/feed/subscriptions`
- **THEN** the dimming is applied to all eligible video `yt-lockup-view-model` elements in the initial viewport before any user scrolling occurs

### Requirement: Overlay does not affect Shorts
The extension SHALL NOT add an overlay to Shorts videos in the subscriptions feed, even if the Short has been watched.

#### Scenario: Shorts in subscriptions feed are not affected
- **WHEN** the user opens `www.youtube.com/feed/subscriptions` and a Shorts card appears in the feed
- **THEN** the extension does not add an overlay to that Shorts thumbnail regardless of watch status

### Requirement: Overlay is purely cosmetic
The card dimming SHALL NOT affect video functionality. Users can still click, watch, and interact with dimmed video cards normally.

#### Scenario: Overlay does not prevent video playback
- **WHEN** the user clicks on a dimmed video card
- **THEN** the video plays normally and the dimming does not block or interfere with playback

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

