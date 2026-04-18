## Why

On the YouTube subscriptions feed (`/feed/subscriptions`), users need a quick visual way to identify videos they have already watched. Currently, watched videos only show a small red progress bar at the bottom of the thumbnail, which can be easy to miss. A more prominent semi-transparent overlay on the thumbnail would make it immediately obvious which videos have been seen.

## What Changes

- Add a semi-transparent black overlay (`rgba(0, 0, 0, 0.4)`) across the entire thumbnail image for videos marked as seen (80%+ watch progress)
- The overlay appears immediately on page load without waiting for page to settle
- Only affects `/feed/subscriptions` page
- Shorts in the subscriptions feed are excluded from this feature
- Overlay is purely cosmetic - it does not affect video functionality

## Capabilities

### New Capabilities

- `subscriptions-seen-overlay`: Add a visible overlay to watched video thumbnails on the subscriptions feed page

## Impact

- New feature: `src/features/subscriptions-seen-overlay/content.ts`
- Uses MutationObserver to detect and update video cards dynamically
- No external dependencies - pure DOM manipulation
- No API calls or storage
