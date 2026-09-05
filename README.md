# YT Utils

Chrome MV3 extension for desktop YouTube helpers plus an all-pages Google search action on selected text. TypeScript sources build with Vite and `@crxjs/vite-plugin` from `manifest.json` into `extension/`. YouTube features register through `FeatureRegistry` in `src/content.ts`, which activates and deactivates them on SPA navigation.

## Inventory

| Area                    | Path                                                                | Role                                                                                                                                                            |
| ----------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| YouTube features        | `src/features/`                                                     | Page-scoped modules (mark as seen, playback speed, audio/subtitle policy, feed cleanup, watch-panel auto-open, and related DOM helpers) wired into the registry |
| Global selection search | `src/features/global-selection-search/` + `src/global-selection.ts` | Floating Google-search button on ordinary pages; opens results via the service worker                                                                           |
| Shared runtime          | `src/shared/`                                                       | Feature registry, messaging, DOM sync, YouTube DOM/player helpers, structured logs under `yt-utils:logs`                                                        |
| MAIN-world bridge       | `src/main-world/youtube-player-bridge.ts`                           | Injected into the page world to read and drive the YouTube player API for subtitle/audio features                                                               |
| Entrypoints             | `src/background.ts`, `src/content.ts`, `src/global-selection.ts`    | Service worker, YouTube content script, all-URLs selection script                                                                                               |
| Build & quality         | `vite.config.ts`, `vitest.config.ts`, ESLint, Prettier, Husky       | Production build to `extension/`; `npm test` runs Vitest with Istanbul coverage                                                                                 |

Most of the product logic lives in `src/features/` and the YouTube helpers in `src/shared/` (especially `youtube-dom.ts`, `youtube-player.ts`, and the registry/logger). Player-backed features read track metadata through the MAIN-world bridge.

## Layout

```text
.
├── manifest.json          # MV3: service worker, YouTube + MAIN scripts, <all_urls> selection
├── vite.config.ts         # @crxjs build → extension/
├── src/
│   ├── background.ts      # mark-as-seen + Google search handlers, log persistence
│   ├── content.ts         # FeatureRegistry for YouTube pages
│   ├── global-selection.ts
│   ├── features/          # one folder per feature (content / background / tests)
│   ├── main-world/        # page-world player bridge
│   └── shared/            # registry, messaging, DOM/player utilities
└── extension/             # generated loadable package
```

## Setup

```sh
npm install
npm run build
```

Load `extension/` in `chrome://extensions` with Developer mode enabled.

Useful checks: `npm test`, `npm run typecheck`, `npm run lint`.
