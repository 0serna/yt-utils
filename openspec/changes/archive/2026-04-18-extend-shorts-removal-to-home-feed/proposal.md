## Why

The extension already removes the Shorts shelf from the desktop subscriptions feed, but YouTube shows a structurally similar Shorts row on the desktop home feed as well. Users who want a cleaner long-form browsing experience expect the same Shorts-removal behavior on `https://www.youtube.com/` without having to tolerate a different feed surface.

## What Changes

- Extend the existing desktop Shorts-shelf removal behavior so it runs on both the subscriptions feed and the desktop home feed.
- Keep using the structural `ytd-rich-shelf-renderer[is-shorts]` marker and remove the enclosing `ytd-rich-section-renderer` instead of relying on localized text.
- Re-apply removal after YouTube SPA navigation and feed rerenders on either supported surface.
- Avoid affecting watch pages, channel pages, Shorts pages, or unsupported YouTube surfaces.
- Harden the shared removal helper so it can safely remove every matching Shorts shelf rendered on a supported page, not just the first match.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `youtube-subscriptions-feed-controls`: Expand the Shorts-shelf removal requirement from the desktop subscriptions feed to both supported desktop feed surfaces, including `www.youtube.com/`.

## Impact

- Modifies the existing Shorts-removal feature in `src/features/subscriptions-shorts-removal/content.ts` so it matches the desktop home feed in addition to subscriptions.
- Extends shared page-detection and Shorts-shelf DOM helpers in `src/shared/youtube-dom.ts`.
- Updates the `youtube-subscriptions-feed-controls` OpenSpec capability to describe the broader supported-page behavior.
