# youtube-subscriptions-feed-controls Specification

## Purpose

Inline controls that augment supported subscriptions-feed video cards while delegating actions to YouTube's native UI.

## Requirements

### Requirement: Extension shows an inline subscriptions-feed hide control

The extension SHALL render a single inline hide button on supported desktop `www.youtube.com/feed/subscriptions` video cards that expose a native card menu trigger. The button SHALL mount on an owned overlay at the top-left of the card thumbnail surface so it does not compete with YouTube's hover preview controls (top-right) or duration badge (bottom-right). The button SHALL remain visually hidden until the video thumbnail image is hovered (matching native thumbnail controls), or the control receives keyboard focus, and its DOM IDs SHALL use the `yt-utils-` prefix.

#### Scenario: Supported subscriptions card renders the hide control on current lockups

- **WHEN** the user opens the desktop subscriptions feed and a standard video card exposes a native `More actions` menu trigger plus a thumbnail surface
- **THEN** the extension mounts exactly one hide button at the top-left of that card's thumbnail using `yt-utils-` prefixed DOM IDs, hidden until the thumbnail is hovered

#### Scenario: Hide control becomes visible on thumbnail hover

- **WHEN** the user hovers the video thumbnail image of a subscriptions-feed card that has a mounted hide control
- **THEN** the hide control becomes visible for that card and can be activated

#### Scenario: Unsupported YouTube surface does not render the hide control

- **WHEN** the user is on a non-desktop, non-subscriptions, or otherwise unsupported YouTube surface
- **THEN** the extension does not render the subscriptions-feed hide button

#### Scenario: Card lacks required native affordances

- **WHEN** a subscriptions-feed card does not expose the native card menu trigger required for hiding, or no usable thumbnail placement surface is available
- **THEN** the extension does not render a hide button for that card

### Requirement: Inline hide control triggers the native card hide action

The subscriptions-feed hide button SHALL activate YouTube's existing hide behavior for the same card by opening that card's native `More actions` menu and selecting the native `Hide` menu item.

#### Scenario: Hide button activates native hide action

- **WHEN** the user clicks the injected hide button on a supported subscriptions-feed card and the native `Hide` menu item is available for that card
- **THEN** the extension opens that card's native menu and activates the native `Hide` item for the same card

#### Scenario: Native hide item is unavailable

- **WHEN** the user clicks the injected hide button but the native menu does not expose a usable `Hide` action for that card
- **THEN** the extension does not activate any other menu item and does not remove the card through custom logic

### Requirement: Hide control remains stable across feed rerenders

The extension SHALL keep the subscriptions-feed hide control aligned with the correct card across YouTube SPA navigation and subscriptions-feed rerenders, and it SHALL avoid duplicating controls on the same card.

#### Scenario: Feed rerender preserves a single control per eligible card

- **WHEN** YouTube rerenders an eligible subscriptions-feed card after the feature has already injected a hide button
- **THEN** the extension restores or preserves exactly one hide button for that card without duplicating the control

#### Scenario: SPA navigation into subscriptions feed initializes controls

- **WHEN** the user navigates into `www.youtube.com/feed/subscriptions` through YouTube's SPA navigation
- **THEN** the extension initializes the subscriptions-feed hide controls for newly eligible cards on that page

### Requirement: Placement failures are observable

When subscriptions-feed cards expose a native hide menu trigger but the extension cannot resolve any thumbnail placement surface, the feature SHALL record a runtime error through the feature logger so the breakage is visible in extension logs.

#### Scenario: Menu-capable cards without placement surface log once

- **WHEN** the subscriptions feed contains one or more cards with a native menu trigger and none of those cards expose a usable placement surface
- **THEN** the feature logs a runtime placement failure error at most once until deactivation
