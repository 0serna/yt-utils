## Context

The extension currently runs only from the browser action. The active implementation keeps Chrome API orchestration in `background.js` and injects the mark-as-seen DOM automation into the active tab on demand. That split is worth preserving because the page automation is already scoped to supported YouTube watch pages and has explicit failure handling.

This change adds a second entry point inside the desktop YouTube watch page itself. The new button must feel native to the YouTube action row, appear immediately after the Like button when possible, survive YouTube's SPA navigation and rerender behavior, and reuse the same automation flow that already exists for the browser action.

## Goals / Non-Goals

**Goals:**
- Preserve the existing browser action trigger without changing its user-visible behavior.
- Add a desktop-only inline check button to standard `www.youtube.com/watch` pages.
- Place the button immediately after the Like button when a compatible anchor is available.
- Reuse a single automation orchestration path for both the browser action and the inline button.
- Keep inline feedback minimal by reflecting running, success, and failure on the button itself.

**Non-Goals:**
- Supporting `m.youtube.com`, Shorts, playlists, embeds, or other non-standard watch surfaces.
- Building a popup, settings page, notifications system, or persistent status history.
- Guaranteeing exact button placement across every future YouTube experiment when the Like anchor is unavailable.

## Decisions

### Add a desktop-only content script for watch-page UI injection
The extension will add a content script that runs on desktop YouTube pages and is responsible only for page-presence concerns: detecting supported watch pages, finding the action row, inserting the inline check button, and keeping that button synchronized with the current page lifecycle.

This is the smallest architecture that can place UI inside YouTube while leaving the existing automation entry point intact.

Alternative considered: injecting UI from the background worker only when the browser action is clicked. Rejected because the button needs to exist before any click and stay present across watch-page transitions.

### Keep the background worker as the single automation orchestrator
The inline button will send a runtime message to the background worker, and the worker will run the same validation, script injection, redirect, and status handling path used by `chrome.action.onClicked`.

This keeps all privileged extension orchestration in one place and avoids duplicating the mark-as-seen flow across content-script and background contexts.

Alternative considered: moving the full automation flow into the content script. Rejected because it would duplicate tab validation and make the inline button path diverge from the browser-action path.

### Treat the Like button as the preferred insertion anchor, with same-row fallback
The content script will identify the desktop watch-page action bar, locate the Like button, and insert the new check button immediately after it when possible. If YouTube renders a compatible action row but the exact Like adjacency is temporarily unavailable, the extension may fall back to inserting within the same action group rather than skipping the button entirely.

This preserves the intended UX while acknowledging that YouTube's DOM structure can vary between rerenders and experiments.

Alternative considered: a floating overlay button. Rejected because it does not match the requested interaction pattern of Like followed by Mark as Seen.

### Represent state on the inline button itself
The inline button will be icon-only, using a check icon plus accessible labeling via `aria-label` and `title`. While the automation is running, the same button remains visible in place and reflects a running state. Success and failure use brief inline visual state changes rather than a separate popup or toast.

This satisfies the requested minimal UX and avoids adding extra surfaces.

Alternative considered: dedicated notifications or tooltips for every outcome. Rejected because they add more UI complexity than the user requested.

### Observe YouTube SPA transitions and rerenders idempotently
The content script will treat button insertion as an idempotent operation: detect the current watch-page state, ensure exactly one inline button exists for the active page, and re-run placement when the URL or action-row DOM changes.

This is necessary because YouTube frequently updates the watch-page shell without a full page reload.

Alternative considered: one-time insertion on initial load only. Rejected because the button would disappear or drift after client-side navigation.

## Risks / Trade-offs

- [YouTube changes the action-row DOM or Like-button structure] -> Keep selectors localized, prefer semantic attributes where available, and allow same-row fallback when exact adjacency is not possible.
- [SPA rerenders duplicate or orphan the inline button] -> Make insertion idempotent and revalidate ownership before creating or moving the button.
- [Inline state becomes confusing without text] -> Use clear accessible labels and a distinct running/terminal visual treatment while keeping the icon-only layout.
- [Two entry points drift over time] -> Route both triggers through the same background orchestration path and avoid duplicating automation logic.

## Migration Plan

1. Extend the manifest with the content-script wiring needed for desktop YouTube page presence.
2. Refactor background orchestration so both the browser action and inline button can invoke the same execution path.
3. Add the inline button injection and lifecycle handling for desktop watch pages.
4. Verify that both triggers work on a standard desktop watch page and that the button persists correctly across client-side video navigation.

Rollback is straightforward: remove the content script and inline-trigger wiring while retaining the original browser-action flow.

## Open Questions

- Which specific YouTube desktop action-row selectors remain stable enough to prefer as the primary Like-button anchor?
- Should temporary success and failure states automatically reset after a short delay, or only when the page rerenders or the user navigates?
