## Why

The extension already adds inline YouTube controls, but subscriptions-feed cards still require opening the `More actions` menu to reach the native `Hide` action. Adding a direct hide button next to YouTube's existing thumbnail overlay actions makes repetitive feed cleanup faster while still delegating the actual hide behavior to YouTube's own menu flow.

## What Changes

- Add a desktop-only subscriptions-feed content feature that runs on `https://www.youtube.com/feed/subscriptions`.
- Detect eligible video cards in the subscriptions feed and inject a single inline hide button alongside the existing thumbnail overlay actions such as `Watch later` and `Add to queue`.
- Trigger YouTube's native hide behavior by opening the card's `More actions` menu and activating the existing `Hide` menu item for that same card.
- Keep the injected button present across YouTube SPA navigation and feed rerenders without duplicating controls on the same card.
- Avoid rendering the control on unsupported YouTube surfaces or cards that do not expose the required native hide action.

## Capabilities

### New Capabilities

- `youtube-subscriptions-feed-controls`: inline controls that augment supported subscriptions-feed video cards while delegating actions to YouTube's native UI.

### Modified Capabilities

None.

## Impact

- Affects `src/content.ts` and `src/shared/feature-registry.ts` because the registry must support a subscriptions-feed feature in addition to watch-page features.
- Adds a new YouTube content feature responsible for card detection, button injection, and native-menu automation on subscriptions cards.
- Adds or extends shared DOM helpers for locating subscriptions-feed cards, thumbnail overlay action hosts, card menu buttons, and native `Hide` menu items.
