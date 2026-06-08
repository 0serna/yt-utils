## Why

YouTube's desktop subscriptions feed can render a `Most relevant` shelf above the chronological subscription items. That shelf duplicates videos that also appear later in the feed, which disrupts chronological scanning.

## What Changes

- Add a content-script feature that removes the desktop subscriptions feed `Most relevant` shelf.
- Remove the whole shelf section, including its `Show more` / `Show less` controls and all videos inside it.
- Re-apply removal after YouTube SPA navigation and feed rerenders.
- Keep regular chronological subscription video cards visible and functional.

## Capabilities

### New Capabilities

- `subscriptions-most-relevant-removal`: Removes the `Most relevant` shelf from the desktop subscriptions feed while preserving chronological feed items.

### Modified Capabilities

## Impact

- Adds a new content feature under `src/features/` and registers it from `src/content.ts`.
- May add localized YouTube DOM helpers in `src/shared/youtube-dom.ts` for detecting the `Most relevant` shelf.
- No new permissions, dependencies, background handlers, or user-facing settings.
