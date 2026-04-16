# YT Utils

YT Utils is a Chrome extension for YouTube and general webpage text lookup.

## Features

- Marks videos as watched.
- Provides playback speed utilities.
- Shows an inline Google search action for selected text on ordinary webpages.

## Setup

```sh
npm install
npm run build
```

Then load the generated extension from the build output in `chrome://extensions` with Developer mode enabled.

## Development

- `npm run check` - run Biome checks and TypeScript type checking
- `npm run build` - production build

## Project Structure

- `src/background.ts` - extension background entrypoint
- `src/content.ts` - YouTube content-script entrypoint
- `src/global-selection.ts` - global selection content-script entrypoint
- `src/features/` - feature-specific logic
- `src/shared/` - shared YouTube helpers and messaging utilities

The global selection feature runs on ordinary webpages, so the extension requests broader page access than the YouTube-only helpers did previously.
