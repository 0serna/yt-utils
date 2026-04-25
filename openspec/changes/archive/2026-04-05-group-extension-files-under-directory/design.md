## Context

The repository currently places `manifest.json` and `background.js` at the top level alongside documentation and OpenSpec metadata. That layout works for Chrome's unpacked loader, but it forces contributors to select the entire repository directory instead of a purpose-built extension folder.

This change is a small repository-layout refactor rather than a feature rewrite. The main constraint is that Chrome resolves service worker and asset paths relative to the manifest location, so the move must keep manifest-relative references valid while preserving the existing runtime behavior.

## Goals / Non-Goals

**Goals:**

- Move the extension runtime files into a dedicated subdirectory such as `extension/`.
- Preserve the current MV3 manifest wiring and background automation behavior after the move.
- Make contributor documentation point to the dedicated unpacked-extension directory.

**Non-Goals:**

- Changing the user-visible mark-as-seen flow or adding new extension features.
- Introducing a build step, bundler, or packaging pipeline.
- Reorganizing unrelated repository files outside what is needed for the extension move.

## Decisions

### Use a dedicated top-level `extension/` directory

Place `manifest.json`, `background.js`, and future extension-only assets under a single top-level `extension/` folder. This gives Chrome a clean directory to load and keeps extension runtime files separate from OpenSpec documents and repository metadata.

Alternative considered: keeping the current root layout and only updating documentation. Rejected because it does not solve the underlying directory-selection friction.

### Keep manifest-relative runtime paths unchanged inside the new folder

The manifest will continue to reference `background.js` with a relative path that is valid from inside `extension/`. Any future icon or asset references should follow the same rule: paths remain relative to the manifest file rather than the repository root.

Alternative considered: moving the manifest while leaving runtime files elsewhere. Rejected because it creates cross-directory references and defeats the goal of a self-contained loadable folder.

### Update contributor documentation in the same change

The README load instructions will explicitly point users to the dedicated extension folder. This keeps the operational guidance aligned with the repository layout and avoids confusion immediately after the move.

Alternative considered: relying on contributors to infer the new path from the repository structure. Rejected because the whole purpose of the change is to make loading clearer.

## Risks / Trade-offs

- [Relative paths break after moving files] -> Keep all extension runtime assets colocated under the manifest directory and verify the manifest still resolves the background service worker.
- [Documentation and code drift out of sync] -> Update README instructions in the same implementation step as the file move.
- [Future extension assets end up split across root and subdirectory] -> Treat the dedicated extension directory as the default home for browser-facing files going forward.

## Migration Plan

Move the existing extension files into `extension/`, update any affected manifest-relative references, and revise the README loading instructions to use that directory. Verification consists of loading `extension/` via Chrome's unpacked extension flow and confirming the browser action still works on a supported YouTube watch page.

Rollback is straightforward: move the extension files back to the repository root and restore the previous README path if the new layout causes loading issues.

## Open Questions

- Should the dedicated directory be named `extension/` or `chrome-extension/` to better reflect its scope?
- Are there any future static assets planned that should be moved now to avoid another layout change soon?
