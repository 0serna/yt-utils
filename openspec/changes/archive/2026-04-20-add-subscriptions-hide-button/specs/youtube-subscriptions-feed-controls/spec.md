## ADDED Requirements

### Requirement: Extension shows an inline subscriptions-feed hide control

The extension SHALL render a single inline hide button on supported desktop `www.youtube.com/feed/subscriptions` video cards. The button SHALL be inserted into the same thumbnail overlay action cluster that contains YouTube's native `Watch later` and `Add to queue` controls, and its DOM IDs SHALL use the `yt-utils-` prefix.

#### Scenario: Supported subscriptions card renders the hide control

- **WHEN** the user opens the desktop subscriptions feed and a standard video card exposes the native thumbnail quick-action cluster
- **THEN** the extension displays exactly one hide button in that card's thumbnail overlay action area using `yt-utils-` prefixed DOM IDs

#### Scenario: Unsupported YouTube surface does not render the hide control

- **WHEN** the user is on a non-desktop, non-subscriptions, or otherwise unsupported YouTube surface
- **THEN** the extension does not render the subscriptions-feed hide button

#### Scenario: Card lacks required native affordances

- **WHEN** a subscriptions-feed card does not expose the native overlay action host or the native card menu trigger required for hiding
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
