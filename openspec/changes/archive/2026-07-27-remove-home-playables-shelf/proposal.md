## Why

YouTube's desktop Home feed injects a Playables Shelf promoting instant games (`/playables`). That shelf interrupts video browsing and is unrelated to subscribed or recommended video content.

## What Changes

- Add a content-script feature `home-playables-removal` that removes every Playables Shelf from desktop Home (`www.youtube.com/`).
- Identify each Playables Shelf by a `/playables` link on the shelf (not by localized title text).
- Remove the enclosing `ytd-rich-section-renderer` from the DOM (silent client-side removal; do not click YouTube's "Not interested").
- Re-apply removal after SPA navigation and Home feed rerenders via MutationObserver.

## Capabilities

### New Capabilities

- `home-playables-removal`: Removes every Playables Shelf from the desktop Home feed while leaving other Home shelves and video cards intact.

## Impact

- Adds a new content feature under `src/features/home-playables-removal/` and registers it from `src/content.ts`.
- Adds DOM helpers in `src/shared/youtube-dom.ts` for detecting and removing Playables Shelves.
- No new permissions, dependencies, background handlers, or user-facing settings.
