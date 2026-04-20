## Context

The repository already injects YouTube UI through small content features registered in `src/content.ts` and activated by `FeatureRegistry`. Those features are currently scoped to watch pages, but the requested subscriptions-feed hide control fits the same general model: detect a stable YouTube surface, locate a native insertion point, inject one compact control, and let YouTube perform the real action.

On the live subscriptions page, supported video cards already expose two thumbnail overlay buttons (`Watch later` and `Add to queue`) plus a separate `More actions` menu containing a native `Hide` item. That means the extension does not need a custom hide backend; it only needs to surface the existing native action earlier in the interaction flow.

## Goals / Non-Goals

**Goals:**
- Add a desktop-only inline hide control on supported `www.youtube.com/feed/subscriptions` video cards.
- Insert that control beside the existing thumbnail overlay actions rather than near the metadata-side `More actions` button.
- Trigger YouTube's own hide behavior for the same card by driving the native menu and `Hide` menu item.
- Keep the button idempotent across feed rerenders and YouTube SPA navigation.
- Avoid rendering a hide button on cards that do not expose the native prerequisites needed to complete the action.

**Non-Goals:**
- Supporting `m.youtube.com`, Home feed, channel feeds, Shorts shelves, playlists, or non-subscriptions YouTube surfaces.
- Replacing YouTube's native menu behavior with private API calls or custom network requests.
- Adding persistence, undo history, batch hide actions, keyboard shortcuts, or extension popup controls for feed cleanup.
- Changing the existing watch-page features beyond the registry work needed to let a subscriptions-feed feature coexist.

## Decisions

### Add a dedicated subscriptions-feed content feature
The change will introduce a new content feature for subscriptions cards instead of extending any existing watch-page feature.

This keeps feed-specific DOM assumptions isolated from watch-page logic and preserves the current pattern of small, focused features registered through the shared registry.

Alternative considered: fold subscriptions handling into an existing watch-page feature. Rejected because the target URL, DOM structure, lifecycle, and user interaction differ substantially from the watch page.

### Expand the feature registry beyond watch-only activation
`FeatureRegistry` will be generalized so features can decide whether they should activate on the current page rather than relying on a single hard-coded watch-page gate.

This is the smallest structural change that supports the new subscriptions-feed feature without forcing unrelated watch-page code into feed contexts.

Alternative considered: create a second standalone content entrypoint for subscriptions pages. Rejected because the current repo already centralizes YouTube features under one content script, and a broader registry predicate is simpler than splitting the runtime entrypoints.

### Inject the button into the thumbnail overlay action host
The hide button will be rendered into the same thumbnail hover overlay host that currently contains the native `Watch later` and `Add to queue` buttons.

This matches the requested placement, keeps the action visually grouped with YouTube's existing quick actions, and avoids adding another metadata-row button competing with `More actions`.

Alternative considered: place the button next to the metadata-side `More actions` button. Rejected because it does not match the intended UX and leaves the thumbnail overlay as the user's primary action cluster.

### Reuse YouTube's native hide menu path instead of calling internal APIs
On click, the feature will locate the corresponding card's `More actions` button, open that menu, find the native `Hide` menu item, and activate it.

This keeps behavior aligned with what YouTube already supports for the card, reduces the amount of reverse-engineering required, and avoids coupling the extension to undocumented request formats.

Alternative considered: reverse-engineer and call YouTube's internal hide request directly. Rejected because it is harder to maintain, more likely to break silently, and unnecessary when the native menu path already exists.

### Gate rendering on native prerequisites, not just page type
The feature will only inject a hide button for cards where the thumbnail overlay action host, `More actions` trigger, and native `Hide` menu item can be resolved reliably.

This ensures the extension does not present a dead control on cards or shelves that look similar to standard subscriptions videos but do not expose the same native affordances.

Alternative considered: render the button on every visible subscriptions card and fail only on click. Rejected because it creates avoidable broken interactions and makes the feed feel less trustworthy.

### Keep matching logic resilient to rerenders and localization
Card-level wiring will be based primarily on DOM locality and existing card structure, while the final native menu action may still need accessible-text matching against `Hide` and localized variants.

This balances practicality with maintainability: most of the control placement can be structural, and only the final menu-item resolution depends on labels that may vary.

Alternative considered: hard-code a purely English text-driven flow for all steps. Rejected because menu and button labels are the most likely part of YouTube's UI to vary by locale.

## Risks / Trade-offs

- [YouTube changes the subscriptions card DOM or overlay host] -> Isolate selectors and card-resolution helpers in shared DOM utilities so future fixes stay localized.
- [The native menu contains multiple visible menus on the page at once] -> Scope menu opening and hide-item resolution to the clicked card interaction, and verify the menu item after the card's own menu button is activated.
- [Localized YouTube labels cause menu-item lookup failures] -> Centralize label matching for `Hide` and extend it with known localized variants as needed.
- [The registry change accidentally activates watch-only features on feed pages] -> Move activation responsibility onto per-feature predicates and keep existing watch-page features explicitly guarded.
- [Some subscriptions items are not standard videos] -> Only inject the button for cards that expose the same native quick-action and menu structure as standard video cards.

## Migration Plan

1. Generalize feature activation so YouTube features can opt into watch pages or subscriptions feed pages independently.
2. Add shared DOM helpers for supported subscriptions cards, overlay action hosts, and card-scoped menu resolution.
3. Implement the subscriptions hide feature with card observation, button injection, and native menu automation.
4. Register the feature in the YouTube content entrypoint and verify idempotent behavior across rerenders and SPA navigation.
5. Validate that clicking the injected button hides the intended card and that unsupported cards do not receive the control.

Rollback is straightforward: remove the new feature registration and helper usage, leaving existing watch-page behavior unchanged.

## Open Questions

None.
