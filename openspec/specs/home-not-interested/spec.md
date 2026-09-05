# home-not-interested Specification

## Purpose

Inline Home-feed controls that activate YouTube's native Not Interested action on supported video cards.

## Requirements

### Requirement: Extension shows an inline Home not-interested control

The extension SHALL render a single inline not-interested button on supported desktop Home (`www.youtube.com/`) video cards that expose a native card menu trigger. The button SHALL mount on an owned overlay at the top-left of the card thumbnail surface so it does not compete with YouTube's hover preview controls (top-right) or duration badge (bottom-right). The button SHALL remain visually hidden until the video thumbnail image is hovered (matching native thumbnail controls), or the control receives keyboard focus, and its DOM IDs SHALL use the `yt-utils-` prefix.

#### Scenario: Supported Home card renders the not-interested control on current lockups

- **WHEN** the user opens desktop Home and a standard video card exposes a native `More actions` menu trigger plus a thumbnail surface
- **THEN** the extension mounts exactly one not-interested button at the top-left of that card's thumbnail using `yt-utils-` prefixed DOM IDs, hidden until the thumbnail is hovered

#### Scenario: Not-interested control becomes visible on thumbnail hover

- **WHEN** the user hovers the video thumbnail image of a Home card that has a mounted not-interested control
- **THEN** the not-interested control becomes visible for that card and can be activated

#### Scenario: Unsupported YouTube surface does not render the control

- **WHEN** the user is on a non-desktop, non-Home, or otherwise unsupported YouTube surface
- **THEN** the extension does not render the Home not-interested button

#### Scenario: Card lacks required native affordances

- **WHEN** a Home card does not expose the native card menu trigger required for Not Interested, or no usable thumbnail placement surface is available
- **THEN** the extension does not render a not-interested button for that card

### Requirement: Inline control triggers the native Not Interested action

The Home not-interested button SHALL activate YouTube's existing Not Interested behavior for the same card by opening that card's native `More actions` menu and selecting the native `Not interested` menu item. The extension SHALL NOT activate other menu items such as `Don't recommend channel`.

#### Scenario: Button activates native Not Interested action

- **WHEN** the user clicks the injected not-interested button on a supported Home card and the native `Not interested` menu item is available for that card
- **THEN** the extension opens that card's native menu and activates the native `Not interested` item for the same card

#### Scenario: Native Not Interested item is unavailable

- **WHEN** the user clicks the injected not-interested button but the native menu does not expose a usable `Not interested` action for that card
- **THEN** the extension does not activate any other menu item and does not remove the card through custom logic

### Requirement: Not-interested control remains stable across feed rerenders

The extension SHALL keep the Home not-interested control aligned with the correct card across YouTube SPA navigation and Home feed rerenders, and it SHALL avoid duplicating controls on the same card.

#### Scenario: Feed rerender preserves a single control per eligible card

- **WHEN** YouTube rerenders an eligible Home card after the feature has already injected a not-interested button
- **THEN** the extension restores or preserves exactly one not-interested button for that card without duplicating the control

#### Scenario: SPA navigation into Home initializes controls

- **WHEN** the user navigates into `www.youtube.com/` through YouTube's SPA navigation
- **THEN** the extension initializes the Home not-interested controls for newly eligible cards on that page

### Requirement: Placement failures are observable

When Home cards expose a native menu trigger but the extension cannot resolve any thumbnail placement surface, the feature SHALL record a runtime error through the feature logger so the breakage is visible in extension logs.

#### Scenario: Menu-capable cards without placement surface log once

- **WHEN** Home contains one or more cards with a native menu trigger and none of those cards expose a usable placement surface
- **THEN** the feature logs a runtime placement failure error at most once until deactivation
