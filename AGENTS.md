# Agent Instructions

## Commands

- `npm run build` - build extension (outputs to `extension/`)
- `npm run check` - biome lint/format + tsc + openspec validate

## Workflow

- Use `playwriter` to explore and analyze web pages.
- When you need to validate the extension, you can run `npm run build` and ask the user (`question` tool) to reload the extension.

## Architecture

- Chrome extension (MV3) built with Vite + `@crxjs/vite-plugin`
- `src/background.ts` - service worker
- `src/content.ts` - YouTube content script
- `src/global-selection.ts` - runs on all pages for text selection
- `src/main-world/` - MAIN world scripts (YouTube player bridge)
- `src/features/` - feature modules
- `src/shared/` - shared helpers and messaging
- Path aliases: `@features/*`, `@shared/*`
