## Repository Structure

```text
.
├── src/                    # TypeScript extension source
│   ├── features/           # feature modules with content/background logic
│   ├── main-world/         # MAIN-world YouTube player bridge scripts
│   ├── shared/             # shared helpers, messaging, and types
│   ├── background.ts       # extension service worker entrypoint
│   ├── content.ts          # YouTube content-script entrypoint
│   └── global-selection.ts # all-pages text selection content script
└── .github/
    └── workflows/          # GitHub Actions CI
```

## Repository Commands

- `npm install`: install dependencies.
- `npm run build`: build the extension with Vite.
- `npm run check`: verify format, lint, and imports with Biome.
- `npm run check:fix`: apply Biome format, lint, and import fixes.
- `npm test`: run tests with Vitest (coverage via Istanbul).
- `npm run typecheck`: run TypeScript type checking.

## Workflow

- Use `playwriter` to explore and analyze web pages.
- After changing files under `src/` (or anything else that feeds `extension/`), run `npm run build` before asking the user to reload. Done when the build exits 0; then ask the user to reload the extension manually.

## Debugging

- The extension persists structured feature logs in `chrome.storage.local` under `yt-utils:logs`.
- Feature lifecycle logs (`activation`, `deactivation`) are recorded automatically by `src/shared/feature-registry.ts` for features registered in `src/content.ts`.
- Feature error logs use `event: "error"`, include `phase` (`activate`, `deactivate`, or `runtime`) and normalized error details, and are mirrored to `console.error`.
- Log entries include `timestamp`, `feature`, `event`, `url`, optional `videoId`, optional `phase`, and optional `error` details.
- This is not a universal debug logger: `src/global-selection.ts` and background-only flows may use separate console/error handling instead of `yt-utils:logs`.
