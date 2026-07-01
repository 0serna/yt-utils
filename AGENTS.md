## Repository Structure

```text
.
├── src/                  # TypeScript extension source
│   ├── features/         # feature modules with content/background logic
│   ├── main-world/       # MAIN-world YouTube player bridge scripts
│   ├── shared/           # shared helpers, messaging, and types
│   ├── background.ts     # extension service worker entrypoint
│   ├── content.ts        # YouTube content-script entrypoint
│   └── global-selection.ts # all-pages text selection content script
├── openspec/             # specs, changes, and validation
├── scripts/              # local automation (check.sh)
└── extension/            # build output (generated)
```

## Repository Commands

- `npm install`: install dependencies.
- `npm run build`: build the extension with Vite.
- `npm test`: run tests with Vitest (coverage via Istanbul).
- `npm run check`: run ESLint, TypeScript, and OpenSpec validation.
- `npm run format`: format files with Prettier.

## Workflow

- Use `playwriter` to explore and analyze web pages.
- When you need to validate the extension, you can run `npm run build` and ask the user (`question` tool) to reload the extension manually.

## Debugging

- The extension persists structured feature logs in `chrome.storage.local` under `yt-utils:logs`.
- Feature lifecycle logs (`activation`, `deactivation`) are recorded automatically by `src/shared/feature-registry.ts` for features registered in `src/content.ts`.
- Feature error logs use `event: "error"`, include `phase` (`activate`, `deactivate`, or `runtime`) and normalized error details, and are mirrored to `console.error`.
- Log entries include `timestamp`, `feature`, `event`, `url`, optional `videoId`, optional `phase`, and optional `error` details.
- This is not a universal debug logger: `src/global-selection.ts` and background-only flows may use separate console/error handling instead of `yt-utils:logs`.
