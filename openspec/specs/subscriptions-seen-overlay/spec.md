# subscriptions-seen-overlay Specification

## Purpose
TBD - created by archiving change subscriptions-seen-overlay. Update Purpose after archive.
## Requirements
### Requirement: Overlay appears on seen video thumbnails
The extension SHALL add a semi-transparent black overlay (`rgba(0, 0, 0, 0.6)`) across the thumbnail image area for any video in the subscriptions feed that has been watched to 80% or more.

#### Scenario: Seen video shows overlay on page load
- **WHEN** the user opens `www.youtube.com/feed/subscriptions` and a video card has a watch progress of 80% or higher
- **THEN** the extension displays a semi-transparent black overlay across the thumbnail image area immediately on page load

#### Scenario: Unwatched video does not show overlay
- **WHEN** the user opens `www.youtube.com/feed/subscriptions` and a video card has a watch progress below 80%
- **THEN** the extension does not add an overlay to that video's thumbnail

#### Scenario: Video at exactly 80% shows overlay
- **WHEN** the user opens `www.youtube.com/feed/subscriptions` and a video card has a watch progress of exactly 80%
- **THEN** the extension displays the semi-transparent black overlay on that video's thumbnail

### Requirement: Overlay appears immediately without delay
The extension SHALL add the seen overlay to eligible video thumbnails immediately upon feature activation, without waiting for any deferred rendering or user interaction.

#### Scenario: Overlay visible before any user scroll
- **WHEN** the user opens `www.youtube.com/feed/subscriptions`
- **THEN** the seen overlay is applied to all eligible video thumbnails in the initial viewport before any user scrolling occurs

### Requirement: Overlay does not affect Shorts
The extension SHALL NOT add an overlay to Shorts videos in the subscriptions feed, even if the Short has been watched.

#### Scenario: Shorts in subscriptions feed are not affected
- **WHEN** the user opens `www.youtube.com/feed/subscriptions` and a Shorts card appears in the feed
- **THEN** the extension does not add an overlay to that Shorts thumbnail regardless of watch status

### Requirement: Overlay is purely cosmetic
The seen overlay SHALL NOT affect video functionality. Users can still click, watch, and interact with overlaid videos normally.

#### Scenario: Overlay does not prevent video playback
- **WHEN** the user clicks on a seen video thumbnail that has an overlay
- **THEN** the video plays normally and the overlay does not block or interfere with playback

### Requirement: Overlay works with dynamic feed updates
The extension SHALL apply the seen overlay to eligible video cards that appear dynamically in the subscriptions feed through YouTube's SPA navigation or infinite scroll.

#### Scenario: Newly loaded cards show overlay if eligible
- **WHEN** the user scrolls or YouTube loads more content and new video cards appear in the subscriptions feed
- **THEN** the extension applies the seen overlay to any newly visible cards that meet the 80% watch threshold

