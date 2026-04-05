## 1. Move Extension Files

- [x] 1.1 Create a dedicated `extension/` directory and move `manifest.json`, `background.js`, and any extension-only assets into it.
- [x] 1.2 Verify the manifest still references the background service worker and any runtime assets with paths that are valid from inside the dedicated directory.

## 2. Preserve Runtime Behavior

- [x] 2.1 Check for repository-relative references that assume the extension files live at the root and update them for the new layout.
- [x] 2.2 Load the unpacked extension from the dedicated directory and confirm the browser action still runs on a supported YouTube watch page.

## 3. Update Contributor Guidance

- [x] 3.1 Update `README.md` so the local loading instructions point to the dedicated extension directory.
- [x] 3.2 Document any manual verification notes that changed because the extension is now loaded from the subdirectory.
