## MODIFIED Requirements

### Requirement: Entire card dims for seen videos

The extension SHALL apply CSS `opacity: 0.4` to the `yt-lockup-view-model` element for any non-Shorts video card on desktop `www.youtube.com` that has YouTube native watch progress of 90% or more, dimming the thumbnail, title, channel name, and all metadata together. Video cards without a `yt-lockup-view-model` element SHALL remain unchanged.

#### Scenario: Seen video card dims on a desktop YouTube list surface

- **WHEN** the user opens a desktop `www.youtube.com` page with a video list card containing a `yt-lockup-view-model` and native watch progress of 90% or higher
- **THEN** the extension applies `opacity: 0.4` to the `yt-lockup-view-model` element

#### Scenario: Channel Videos tab seen card dims

- **WHEN** the user opens a channel Videos tab such as `https://www.youtube.com/@rachelsenglish/videos` and a video card contains a `yt-lockup-view-model` with native watch progress of 90% or higher
- **THEN** the extension applies `opacity: 0.4` to that video's `yt-lockup-view-model`

#### Scenario: Watch-page recommendation seen card dims

- **WHEN** the user opens a desktop `www.youtube.com/watch` page and a recommended video card contains a `yt-lockup-view-model` with native watch progress of 90% or higher
- **THEN** the extension applies `opacity: 0.4` to that recommended video's `yt-lockup-view-model`

#### Scenario: Unwatched video card remains fully visible

- **WHEN** the user opens a desktop `www.youtube.com` page and a video card has native watch progress below 90%
- **THEN** the extension does not modify the opacity of that video's `yt-lockup-view-model`

#### Scenario: Video at exactly 90% shows dimming

- **WHEN** the user opens a desktop `www.youtube.com` page and a video card has native watch progress of exactly 90%
- **THEN** the extension applies `opacity: 0.4` to that video's `yt-lockup-view-model`

#### Scenario: Unsupported card wrapper remains unchanged

- **WHEN** the user opens a desktop `www.youtube.com` page and a video card has native watch progress of 90% or higher but does not contain a `yt-lockup-view-model`
- **THEN** the extension does not modify that card's opacity

### Requirement: Dimming does not affect Shorts

The extension SHALL NOT apply opacity dimming to Shorts videos on any desktop `www.youtube.com` surface, even if the Short has native watch progress of 90% or higher.

#### Scenario: Shorts in a desktop YouTube list are not dimmed

- **WHEN** the user opens a desktop `www.youtube.com` page and a Shorts card appears in a video list
- **THEN** the extension does not modify the opacity of that Shorts card regardless of watch status

### Requirement: Dimming works with dynamic feed updates

The extension SHALL apply opacity dimming to eligible video cards that appear dynamically on desktop `www.youtube.com` through SPA navigation, infinite scroll, or delayed hydration of YouTube's native watched-progress indicators.

#### Scenario: Newly loaded cards dim if eligible

- **WHEN** the user scrolls or YouTube loads more content and new desktop video list cards appear
- **THEN** the extension applies dimming to any newly visible `yt-lockup-view-model` cards that meet the 90% watch threshold

#### Scenario: Existing card dims after watched progress indicator is inserted

- **WHEN** YouTube inserts a native watched-progress indicator into an existing desktop video list card and the progress is 90% or higher
- **THEN** the extension applies `opacity: 0.4` to that card's `yt-lockup-view-model` without requiring a page reload

#### Scenario: Existing card dims after watched progress width is updated

- **WHEN** YouTube updates an existing watched-progress indicator from below 90% to 90% or higher in a desktop video list card
- **THEN** the extension applies `opacity: 0.4` to that card's `yt-lockup-view-model` without requiring user scrolling or navigation

### Requirement: Dimming is removed on feature deactivation

When the seen-card-dimming feature is deactivated, the extension SHALL restore full opacity (`opacity: ""`) only on `yt-lockup-view-model` elements previously dimmed by this feature.

#### Scenario: Extension-dimmed cards restore on feature deactivation

- **WHEN** the user disables the seen-card-dimming feature
- **THEN** all `yt-lockup-view-model` elements dimmed by this feature return to full opacity immediately

#### Scenario: Unowned inline opacity is preserved on feature deactivation

- **WHEN** a `yt-lockup-view-model` has inline opacity that was not applied by the seen-card-dimming feature
- **AND** the user disables the seen-card-dimming feature
- **THEN** the extension does not modify that element's opacity
