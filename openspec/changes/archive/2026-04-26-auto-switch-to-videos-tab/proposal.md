## Why

Navigating to a YouTube channel profile currently lands on the **Home** tab by default, which mixes featured content, playlists, and curated sections. Users who want to browse a channel's video library must manually click the **Videos** tab every time. This repetitive interaction adds friction when the primary intent is to see all videos from a channel.

## What Changes

- Introduce a new content-script feature that automatically clicks the **Videos** tab when landing on a channel's **Home** tab.
- The redirect happens **once per browser tab session** (tracked via `sessionStorage`), so users can still navigate back to Home manually without being redirected again.
- Register the new feature in the existing `FeatureRegistry` so it follows the same lifecycle as other content features.

## Capabilities

### New Capabilities

- `auto-switch-to-videos-tab`: Automatically switches the active tab from "Home" to "Videos" when a user first visits a YouTube channel's home page in a given browser tab session.

### Modified Capabilities

- None. No existing spec-level behavior changes.

## Impact

- **New file**: `src/features/auto-switch-to-videos-tab/content.ts`
- **Modified file**: `src/content.ts` (import and register the new feature)
- No changes to background scripts, messaging, or UI components.
- No breaking changes.
