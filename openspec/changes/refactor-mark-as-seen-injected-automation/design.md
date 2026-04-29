## Context

The current mark-as-seen flow validates the active tab in the background service worker and then injects a serialized function with `chrome.scripting.executeScript({ func })`. That serialized function must contain local copies of helper logic because imported helpers are not available inside the injected function body.

The extension already has a YouTube content script and internal runtime messaging, making a content-script-owned automation path feasible.

## Goals / Non-Goals

**Goals:**

- Move mark-as-seen automation execution into the YouTube content script message path.
- Reuse shared helper modules instead of duplicating helper code inside an injected function.
- Preserve extension action behavior, inline trigger behavior, badge/status reporting, and failure responses.
- Remove structural duplication required by serialized function injection.

**Non-Goals:**

- Changing the ordered automation behavior: seek near completion, briefly play, then pause.
- Changing the inline button UI or action badge semantics.
- Introducing a popup, options page, or new user-facing controls.

## Decisions

- Add a message type for background-to-content mark-as-seen automation requests and responses, using the existing `yt-utils:` message prefix.
- Keep active-tab URL validation in the background before requesting content automation so unsupported pages fail quickly.
- Implement the automation in normal content-script code so it can import shared wait/error helpers and avoid function serialization constraints.
- Keep result normalization in the background so action badge status remains centralized.
- Treat missing content-script response as an automation failure with a clear message, because the content script may not be loaded on unsupported or restricted pages.

## Risks / Trade-offs

- Background-to-content messaging can fail if the content script is unavailable. → Preserve URL validation and return a clear failure when messaging fails.
- Moving automation contexts can affect access to page elements. → The existing automation only needs DOM/video access available to the content script, not MAIN-world-only player internals.
- Timing differences may affect watched-state registration. → Preserve seek/play/pause timing and validate manually on a supported YouTube watch page.
