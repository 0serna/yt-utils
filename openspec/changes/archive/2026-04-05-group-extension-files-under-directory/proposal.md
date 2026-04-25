## Why

The extension currently lives at the repository root, so loading it in the browser requires selecting the whole project directory instead of a dedicated extension folder. Grouping the extension files under a single subdirectory makes local loading clearer and separates browser-facing assets from OpenSpec and repository metadata.

## What Changes

- Move the Chrome extension runtime files into a dedicated subdirectory that can be selected directly in `chrome://extensions`.
- Keep the existing mark-as-seen behavior unchanged after the move by updating manifest-relative paths and any code references affected by the new layout.
- Update local setup documentation so it points to the dedicated extension directory instead of the repository root.

## Capabilities

### New Capabilities

- `extension-repository-layout`: The repository exposes the browser extension from a dedicated directory so users can load that directory directly as an unpacked extension.

### Modified Capabilities

None.

## Impact

- Moves `manifest.json`, `background.js`, and any future extension-only assets out of the repository root.
- Updates documentation for local extension loading.
- Preserves existing extension behavior while changing the source layout expected by contributors.
