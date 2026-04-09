## 1. Project scaffolding

- [ ] 1.1 Initialize `package.json` with `name`, `version`, `description`, and npm scripts (`build`, `dev`, `typecheck`)
- [ ] 1.2 Install Vite, `@crxjs/vite-plugin`, TypeScript, and Chrome extension type definitions as dev dependencies
- [ ] 1.3 Create `tsconfig.json` with `strict: true`, `outDir`, and path aliases for `@features/*` and `@shared/*`
- [ ] 1.4 Create `vite.config.ts` with CRXJS plugin configured to read `extension/manifest.json`
- [ ] 1.5 Add `.gitignore` entries for `node_modules/`, `extension/background.js`, `extension/content.js`, and any Vite output chunks

## 2. Shared module extraction

- [ ] 2.1 Create `src/shared/types.ts` with the `Feature` interface (`name`, `isWatchPage`, `activate`, `deactivate`) and `FeatureContext` type
- [ ] 2.2 Create `src/shared/messaging.ts` with typed message constants (`yt-utils:inline-trigger`, etc.) and `sendMessage`/`onMessage` helpers
- [ ] 2.3 Create `src/shared/youtube-dom.ts` extracting the DOM helper functions (`waitFor`, `findButton`, `findShareDialog`, `findStartAtCheckbox`, `findShareUrlInput`, `isVisible`, `getElementLabel`, `clickElement`) from the current `background.js` automation function
- [ ] 2.4 Create `src/shared/feature-registry.ts` with the `FeatureRegistry` class that manages feature lifecycle on YouTube SPA navigation events

## 3. Mark-as-seen feature migration

- [ ] 3.1 Create `src/features/mark-as-seen/types.ts` with feature-specific types (automation result, error codes)
- [ ] 3.2 Create `src/features/mark-as-seen/background.ts` extracting the message handler logic from `background.js`, importing from `@shared/messaging`
- [ ] 3.3 Create `src/features/mark-as-seen/content.ts` extracting the inline button logic from `content.js`, implementing the `Feature` interface with `activate`/`deactivate`, importing from `@shared/messaging` and `@shared/youtube-dom`
- [ ] 3.4 Create `src/features/mark-as-seen/automation.ts` extracting the `runYoutubeMarkAsSeenAutomation` function and its helpers from `background.js`, importing from `@shared/youtube-dom`

## 4. Barrel files

- [ ] 4.1 Create `src/background.ts` that imports all feature background handlers and registers their `chrome.runtime.onMessage` listeners
- [ ] 4.2 Create `src/content.ts` that imports all feature content modules, creates a `FeatureRegistry`, and registers all features

## 5. Manifest and build integration

- [ ] 5.1 Update `extension/manifest.json` to reference the Vite-resolved entry points for `background.service_worker` and `content_scripts[].js` (CRXJS will resolve these at build time)
- [ ] 5.2 Remove the hand-written `extension/background.js` and `extension/content.js` from version control
- [ ] 5.3 Verify `npm run build` produces a working `extension/` directory loadable by Chrome

## 6. Documentation

- [ ] 6.1 Update `README.md` to document the build step (`npm install && npm run build`) as part of local setup
- [ ] 6.2 Update `README.md` to document `npm run dev` for development with HMR
- [ ] 6.3 Update `README.md` to document `npm run typecheck` for type checking

## 7. Verification

- [ ] 7.1 Run `npm run typecheck` and verify zero type errors
- [ ] 7.2 Run `npm run build` and load the extension in Chrome via `Load unpacked`
- [ ] 7.3 Open a YouTube watch page and verify the inline button appears
- [ ] 7.4 Trigger the mark-as-seen flow and verify tab redirects correctly with no console errors
- [ ] 7.5 Verify the extension action also triggers the mark-as-seen flow correctly