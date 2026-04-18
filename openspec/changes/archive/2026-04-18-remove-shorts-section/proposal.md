## Why

YouTube injects a "Shorts" section into the desktop subscriptions feed (`/feed/subscriptions`). Users who prefer long-form video content find this section distracting and want it removed from their feed entirely.

## What Changes

- Add a desktop-only subscriptions-feed content feature that runs on `https://www.youtube.com/feed/subscriptions`.
- Detect the Shorts shelf (`ytd-rich-shelf-renderer[is-shorts]`) and remove its parent section from the DOM.
- Re-apply removal across YouTube SPA navigation and feed rerenders.
- Avoid affecting non-Shorts content or unsupported YouTube surfaces.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `youtube-subscriptions-feed-controls`: Add requirement to detect and remove the Shorts shelf section from the subscriptions feed.

## Impact

- Adds a new content feature file `src/features/subscriptions-shorts-removal/content.ts`.
- Registers the feature in `src/content.ts`.
- Adds shared DOM helpers for detecting the Shorts shelf in `src/shared/youtube-dom.ts`.
- Reuses existing `isDesktopSubscriptionsFeedPage()` and `FeatureRegistry` infrastructure.
