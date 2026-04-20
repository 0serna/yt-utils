## Why

The current `subscriptions-seen-overlay` feature only dims the thumbnail image of watched videos, leaving the title, channel name, and metadata fully visible. This creates an inconsistent visual experience where users must still parse through visible text to identify seen videos. Users want the entire video card to be visually de-emphasized for quick scanning of the subscriptions feed.

## What Changes

- The dimming effect will extend from the thumbnail-only overlay to the entire video card (`yt-lockup-view-model`), including thumbnail, title, channel avatar, and metadata
- The existing thumbnail-only dark overlay will be removed in favor of a simpler CSS opacity approach applied to the card element
- The opacity value will be set to `0.4` for seen videos (80%+ watch progress)
- No hover restoration — cards remain dimmed consistently
- No transition animation — opacity is applied instantly
- Feature scope remains limited to the subscriptions feed (`/feed/subscriptions`)

## Capabilities

### New Capabilities

- `seen-card-dimming`: Entire video card opacity effect for watched videos in the subscriptions feed, replacing the thumbnail-only overlay with a card-level CSS opacity approach

### Modified Capabilities

- `subscriptions-seen-overlay`: The existing thumbnail overlay behavior is replaced by card-level dimming; the requirement changes from "overlay on thumbnail" to "opacity on entire card"

## Impact

- **Affected files**: `src/features/subscriptions-seen-overlay/content.ts` (primary), potentially `src/shared/youtube-dom.ts` (if new DOM helpers needed)
- **Removed**: Thumbnail overlay injection logic, `OVERLAY_CLASS` constant usage
- **Added**: Card-level opacity styling via inline CSS on `yt-lockup-view-model`
- **No breaking changes**: Feature is purely visual, no API or storage changes
