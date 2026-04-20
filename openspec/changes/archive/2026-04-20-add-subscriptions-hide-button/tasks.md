## 1. Feature activation and shared DOM support

- [x] 1.1 Generalize `src/shared/feature-registry.ts` so YouTube features can activate on subscriptions-feed pages without activating watch-only features on unsupported surfaces.
- [x] 1.2 Add shared DOM helpers for detecting supported subscriptions-feed cards, locating each card's thumbnail overlay action host, and resolving the card-scoped `More actions` trigger.
- [x] 1.3 Add shared native-menu helpers for resolving the card's `Hide` menu item in a way that keeps localization-sensitive label matching centralized.

## 2. Subscriptions hide feature

- [x] 2.1 Add and register a dedicated subscriptions-feed content feature alongside the existing watch-page features in `src/content.ts`.
- [x] 2.2 Render a single inline hide button inside each eligible subscriptions-card thumbnail overlay action cluster using `yt-utils-` prefixed DOM IDs.
- [x] 2.3 Implement the hide-button click flow so it opens the same card's native `More actions` menu and activates only the native `Hide` menu item when available.
- [x] 2.4 Add idempotent feed observation and SPA-navigation handling so eligible cards regain exactly one hide button after subscriptions-feed rerenders.

## 3. Verification

- [x] 3.1 Verify that supported desktop subscriptions cards render one hide button beside YouTube's native quick actions.
- [x] 3.2 Verify that clicking the injected hide button triggers YouTube's native `Hide` action for the intended card.
- [ ] 3.3 Verify that unsupported cards or surfaces do not receive a hide button and that rerenders do not duplicate controls.
