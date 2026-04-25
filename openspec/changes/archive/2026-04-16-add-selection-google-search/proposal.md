## Why

The extension currently only enhances YouTube pages, but a lightweight text-selection action would add value across the broader web. Adding an immediate inline "search on Google" action for selected text gives users a fast, low-friction way to jump from reading to lookup without relying on the browser context menu.

## What Changes

- Add a new browser-wide content feature that detects non-empty text selections on supported webpages.
- Show a small floating action icon immediately after selection for normal page text and supported form-field selections.
- Open a Google search for the selected text in a new tab when the user activates the icon.
- Hide or reposition the action as the selection changes or is cleared.
- Expand extension permissions and manifest matching so this feature can run beyond YouTube while leaving existing YouTube helpers intact.

## Capabilities

### New Capabilities

- `global-selection-search`: Detect selected text on supported webpages, present an inline Google search affordance, and open the search in a new tab.

### Modified Capabilities

## Impact

- Affected code: `manifest.json`, `src/background.ts`, a new global content-script path, and a new feature module for selection detection and inline UI.
- Affected systems: Chrome extension host permissions, content script injection scope, and background tab-opening behavior.
- User-facing impact: the extension gains behavior on non-YouTube sites and will request access broad enough to run on arbitrary webpages.
