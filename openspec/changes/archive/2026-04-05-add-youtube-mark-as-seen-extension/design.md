## Context

This repository is starting from an OpenSpec proposal and does not yet contain extension code or existing product constraints. The requested feature is a Chrome extension that runs only when the user clicks the extension action while viewing a YouTube watch page, then automates a DOM-driven flow inside the current tab to make YouTube treat the video as watched.

The feature depends on YouTube's current watch-page player and share dialog markup, so the design must isolate page automation logic from extension wiring and make failures explicit when expected controls are unavailable.

## Goals / Non-Goals

**Goals:**
- Provide a browser-action triggered workflow for the active YouTube watch tab.
- Automate the exact user-visible sequence: seek near the end, pause playback, open Share, enable `Start at`, trigger Copy URL, and redirect the tab to the generated share URL.
- Keep the extension architecture minimal and testable by separating Chrome API orchestration from in-page DOM automation.
- Fail safely when the active tab is not a valid YouTube watch page or when YouTube controls cannot be found.

**Non-Goals:**
- Supporting batch processing of multiple videos, playlists, Shorts, embeds, or YouTube pages outside standard watch URLs.
- Persisting watch history, user settings, or telemetry.
- Guaranteeing compatibility with every future YouTube UI variant without maintenance.

## Decisions

### Use a background service worker plus injected page automation
The extension will use Manifest V3 with a background service worker bound to the browser action. On click, the worker will validate the active tab URL and inject a small automation function into the tab with `chrome.scripting.executeScript`.

This keeps Chrome permission handling in the extension layer and page-specific DOM logic inside the page context where the YouTube player and share dialog are accessible.

Alternative considered: a persistent content script on every YouTube page. Rejected because the feature is only needed on demand and does not require continuous page observation.

### Treat standard watch URLs as the supported entry point
The worker will only run the automation when the active tab URL matches a standard YouTube watch page pattern such as `https://www.youtube.com/watch?...`.

This avoids ambiguous behavior on home feeds, channel pages, Shorts, and embedded players where the required controls differ.

Alternative considered: attempting best-effort support across all YouTube surfaces. Rejected because it would increase selectors, edge cases, and maintenance cost before a basic implementation exists.

### Derive the redirect URL from the Share dialog input value
After enabling `Start at`, the automation will read the URL currently shown in the Share dialog's URL field, then click the dialog's Copy button, and finally ask the extension layer to redirect the tab to the same captured URL.

This preserves the required user-visible copy action while avoiding fragile clipboard-read flows that may require extra permissions or fail due to browser restrictions.

Alternative considered: reading from the clipboard after clicking Copy. Rejected because clipboard access is less reliable in MV3 and is not necessary when the dialog already exposes the final URL.

### Use ordered step execution with explicit waits
The injected automation will execute each step in order and wait for the next control to become available before proceeding. The sequence will stop with a structured error if a required control, dialog, or URL field does not appear in time.

Alternative considered: firing all DOM actions optimistically with fixed delays only. Rejected because YouTube UI timing can vary and fixed sleeps alone make the flow flaky.

## Risks / Trade-offs

- [YouTube DOM changes break selectors] -> Keep selectors localized in one automation module and prefer semantic attributes or player APIs where available.
- [Seeking to 99% does not always trigger watch completion immediately] -> Pause only after the seek operation settles and validate the player time update before proceeding.
- [Share dialog timing varies across browsers or network states] -> Use bounded polling/waits for dialog visibility, checkbox state, and populated URL field.
- [Redirecting the tab changes playback state in a user-visible way] -> This is intentional behavior because the redirected URL is the mechanism that marks the video as watched.

## Migration Plan

No data migration is required. Delivery consists of adding the extension files, loading the unpacked extension in Chrome for local verification, and validating the click flow against a standard YouTube watch page.

Rollback is straightforward: remove or disable the extension.

## Open Questions

- Which YouTube selectors are stable enough for the Share button, `Start at` checkbox, and share URL input in the current UI?
- Should the extension surface user feedback through the action badge, notifications, or a popup when the automation fails?
