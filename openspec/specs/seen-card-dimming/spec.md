# seen-card-dimming Specification

## Purpose

Dim watched subscriptions-feed video cards so already-seen videos are visually de-emphasized without changing YouTube behavior.

## Requirements

### Requirement: Entire card dims for seen videos

The extension SHALL apply CSS `opacity: 0.4` to the `yt-lockup-view-model` element for any video in the subscriptions feed that has been watched to 80% or more, dimming the thumbnail, title, channel name, and all metadata together.

#### Scenario: Seen video card dims on page load

- **WHEN** the user opens `www.youtube.com/feed/subscriptions` and a video card has a watch progress of 80% or higher
- **THEN** the extension applies `opacity: 0.4` to the `yt-lockup-view-model` element immediately on page load

#### Scenario: Unwatched video card remains fully visible

- **WHEN** the user opens `www.youtube.com/feed/subscriptions` and a video card has a watch progress below 80%
- **THEN** the extension does not modify the opacity of that video's `yt-lockup-view-model`

#### Scenario: Video at exactly 80% shows dimming

- **WHEN** the user opens `www.youtube.com/feed/subscriptions` and a video card has a watch progress of exactly 80%
- **THEN** the extension applies `opacity: 0.4` to that video's `yt-lockup-view-model`

### Requirement: Dimming does not affect Shorts

The extension SHALL NOT apply opacity dimming to Shorts videos in the subscriptions feed, even if the Short has been watched.

#### Scenario: Shorts in subscriptions feed are not dimmed

- **WHEN** the user opens `www.youtube.com/feed/subscriptions` and a Shorts card appears in the feed
- **THEN** the extension does not modify the opacity of that Shorts card regardless of watch status

### Requirement: Dimming is purely cosmetic

The card dimming SHALL NOT affect video functionality. Users can still click, watch, and interact with dimmed video cards normally.

#### Scenario: Dimming does not prevent video playback

- **WHEN** the user clicks on a dimmed video card
- **THEN** the video plays normally and the dimming does not block or interfere with playback

### Requirement: Dimming works with dynamic feed updates

The extension SHALL apply opacity dimming to eligible video cards that appear dynamically in the subscriptions feed through YouTube's SPA navigation or infinite scroll.

#### Scenario: Newly loaded cards dim if eligible

- **WHEN** the user scrolls or YouTube loads more content and new video cards appear in the subscriptions feed
- **THEN** the extension applies dimming to any newly visible cards that meet the 80% watch threshold

### Requirement: Dimming is removed on feature deactivation

When the seen-card-dimming feature is deactivated, the extension SHALL restore full opacity (`opacity: ""`) to all previously dimmed `yt-lockup-view-model` elements.

#### Scenario: Cards restore on feature deactivation

- **WHEN** the user disables the seen-card-dimming feature
- **THEN** all dimmed video cards return to full opacity immediately
