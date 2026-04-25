## Why

The extension is growing beyond a single feature (mark-as-seen) toward multiple YouTube utilities (speed control is next). The current flat two-file structure — one `background.js` and one `content.js` — cannot scale cleanly: features share no typed contracts, DOM coordination is ad-hoc, and adding a new feature means editing monolithic files. Introducing Vite as a bundler and TypeScript gives the project feature-level modularity, type-safe interfaces, and a scalable architecture before the second feature is added.

## What Changes

- Add Vite as a build tool with `@crxjs/vite-plugin` (or equivalent) for Chrome extension development
- Add TypeScript and `tsconfig.json`
- Introduce a `FeatureRegistry` pattern: each feature exports `activate`/`deactivate` and registers itself
- Restructure source into `src/features/<name>/` directories (content scripts, background handlers) and `src/shared/` for common utilities
- Migrate `background.js` → `src/background.ts` (barrel that imports feature handlers)
- Migrate `content.js` → `src/content.ts` (barrel that imports `FeatureRegistry` and feature modules)
- Migrate the inline button logic into `src/features/mark-as-seen/content.ts`
- Migrate the automation logic into `src/features/mark-as-seen/background.ts`
- Extract shared YouTube DOM helpers and message types into `src/shared/`
- Configure Vite to output to `extension/` (the loadable Chrome extension directory)
- **BREAKING**: The `extension/` directory becomes a build output — contributors must run `npm run build` before loading locally, and must not edit files in `extension/` directly
- Add `node_modules/`, `dist/`, and `extension/` to `.gitignore` (except manifest.json which remains source-controlled if not generated)

## Capabilities

### New Capabilities

- `build-pipeline`: Vite + TypeScript build pipeline that compiles `src/` into the loadable `extension/` directory, with HMR support during development
- `feature-registry`: A typed registry that coordinates feature lifecycle (activate/deactivate) on YouTube page navigations, enabling multiple features to coexist in the same content script bundle
- `project-structure`: Source layout with `src/features/` for per-feature modules and `src/shared/` for cross-feature utilities, replacing the flat two-file structure

### Modified Capabilities

- `youtube-watch-marking-extension`: The mark-as-seen automation behavior is unchanged at runtime, but its implementation is now split across `src/features/mark-as-seen/content.ts` and `src/features/mark-as-seen/background.ts` instead of the flat `content.js`/`background.js` files
- `extension-repository-layout`: The `extension/` directory becomes a build output. The local setup instructions must document the build step. The loadable directory path remains `extension/` for Chrome's `Load unpacked`.

## Impact

- `extension/background.js` — replaced by Vite-bundled output from `src/background.ts`
- `extension/content.js` — replaced by Vite-bundled output from `src/content.ts`
- `extension/manifest.json` — may become generated or remain source-controlled depending on Vite plugin choice
- New: `vite.config.ts`, `tsconfig.json`, `package.json`, `.gitignore`
- New: `src/` directory tree with features and shared modules
- Removes the ability to edit `extension/` files directly and reload — contributors must use the build pipeline
