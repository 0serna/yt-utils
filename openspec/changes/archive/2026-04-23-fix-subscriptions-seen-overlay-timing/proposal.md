## Why

The subscriptions seen overlay can miss already-watched videos when YouTube renders subscription cards before hydrating their thumbnail progress indicators. The feature works after a full page reload, but SPA timing can leave eligible seen videos undimmed until another qualifying rerender occurs.

## What Changes

- Make the subscriptions seen overlay react to watched-progress indicator insertion and updates inside existing cards, not only to newly added card elements.
- Preserve the current behavior of dimming standard subscriptions feed videos at 80% or more watched progress with `opacity: 0.4`.
- Preserve the current exclusions for Shorts and unsupported pages.
- Avoid adding new dependencies or changing user-facing controls.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `subscriptions-seen-overlay`: Seen-card dimming must apply after YouTube hydrates or updates watched-progress markers within existing subscriptions feed cards.

## Impact

- Affected code: `src/features/subscriptions-seen-overlay/content.ts` and, if needed, shared YouTube DOM helpers in `src/shared/youtube-dom.ts`.
- Affected behavior: subscriptions feed dimming on `www.youtube.com/feed/subscriptions`, especially after SPA navigation and delayed YouTube DOM hydration.
- No API, storage, permission, manifest, or dependency changes are expected.
