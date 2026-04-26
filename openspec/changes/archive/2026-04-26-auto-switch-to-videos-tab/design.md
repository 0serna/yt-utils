## Context

The extension uses a `FeatureRegistry` pattern where each content feature declares a `matchesPage()` predicate and `activate()`/`deactivate()` lifecycle hooks. The registry listens to `yt-navigate-finish` and `popstate` events, plus a 500ms polling interval, to sync active features with the current URL.

YouTube channel pages expose a `tp-yt-paper-tabs` element with `[role="tab"]` children. The "Home" tab has `aria-selected="true"` when the user is on the channel home. Clicking the "Videos" tab triggers an SPA navigation to `.../videos` without a page reload.

## Goals / Non-Goals

**Goals:**

- Automatically click the "Videos" tab when the user lands on a channel's "Home" tab.
- Ensure the auto-switch happens at most once per browser tab session per channel.
- Follow the existing feature lifecycle pattern (`matchesPage`, `activate`, `deactivate`).

**Non-Goals:**

- Adding a user-visible toggle or settings panel.
- Supporting mobile YouTube (m.youtube.com).
- Redirecting to tabs other than "Videos" (e.g., Shorts, Playlists).

## Decisions

**1. Detection via `aria-selected` instead of URL pathname**

- **Rationale**: YouTube channel home pages can have paths like `/@handle`, `/@handle/featured`, `/c/name`, `/user/name`, and `/channel/ID`. Checking the selected tab is more reliable than parsing the URL to determine if the user is on "Home".
- **Alternative**: Parse pathname and treat root channel paths as Home. Rejected because `/featured` and `/about` also render the Home tab as selected.

**2. Session tracking with `sessionStorage`**

- **Rationale**: `sessionStorage` is scoped to the browser tab and survives soft navigations (SPA transitions) within the same tab. This matches the desired "once per tab session" behavior without persisting across tabs.
- **Alternative**: `localStorage` would persist across sessions/tabs, which is too aggressive. Memory-only state would reset on full page reloads, which is too weak.

**3. Simple `waitFor` without cancellation token**

- **Rationale**: The `activate()` function will wait up to 2 seconds for the tablist to appear. If the user navigates away before the timeout, the click will be attempted on a detached or missing element, which fails silently and harmlessly. Adding a cancellation token adds complexity for minimal gain.
- **Alternative**: Use a session token pattern like `ask-auto-open`. Rejected because the blast radius of a stale click is negligible.

**4. `matchesPage` is permissive; validation is strict**

- **Rationale**: `matchesPage` accepts any channel-like URL (`/@handle/*`, `/c/*`, `/user/*`, `/channel/*`). The actual decision to act is deferred to `activate()`, which checks `aria-selected="true"` on the "Home" tab and the sessionStorage flag. This avoids race conditions between URL changes and DOM readiness.

## Risks / Trade-offs

| Risk                                                         | Mitigation                                                                                         |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| YouTube changes the tab element structure or ARIA attributes | Use semantic selectors (`[role="tab"]`) rather than implementation-specific classes or tag names.  |
| Channel has no "Videos" tab (e.g., Shorts-only channels)     | `waitFor` searches for a tab with text content `"Videos"`; if absent, the feature aborts silently. |
| User navigates to Home manually after the auto-switch        | The sessionStorage flag prevents re-switching in the same tab, so the user stays on Home.          |
| `waitFor` races with DOM hydration on slow connections       | 2-second timeout with 100ms polling is sufficient for typical YouTube hydration times.             |
