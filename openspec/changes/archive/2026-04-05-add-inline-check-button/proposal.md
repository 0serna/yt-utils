## Why

The extension currently requires clicking the browser action, which interrupts the watch-page workflow and keeps the control outside the YouTube interface. Adding an inline control next to the Like button makes the feature faster to use in-context while preserving the existing browser-action entry point.

## What Changes

- Add a desktop-only inline button to the standard YouTube watch-page action row.
- Place the inline button immediately after the Like button when a compatible anchor is available, while keeping it visually aligned with native YouTube actions.
- Allow the inline button to trigger the same mark-as-seen automation flow that already runs from the extension action.
- Preserve the existing browser action so users can start the flow either from the extension icon or from the embedded YouTube control.
- Surface minimal inline state for idle, running, success, and failure without introducing a separate popup or settings UI.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `youtube-watch-marking-extension`: expand the extension entry points and watch-page behavior to support a desktop inline check button in the YouTube action bar while preserving the browser action trigger.

## Impact

- Affects the Chrome extension manifest, because the extension will need a page-presence mechanism for desktop YouTube watch pages.
- Adds watch-page UI injection and lifecycle handling for YouTube's SPA navigation and action-bar rerenders.
- Refactors extension wiring so the same automation flow can be started from both the browser action and the inline YouTube button.
