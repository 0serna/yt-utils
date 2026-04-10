# YT Utils

YT Utils is a Chrome extension for YouTube. It currently focuses on watch-page helpers.

## Features

- Marks videos as watched.
- Provides playback speed utilities.

## Requirements

- Node.js 18+
- Google Chrome or another Chromium-based browser with MV3 support

## Setup

```sh
npm install
npm run build
```

Then load the generated extension from the build output in `chrome://extensions` with Developer mode enabled.

## Development

- `npm run build` - production build
- `npm run watch` - build in watch mode
- `npm run typecheck` - type check only

## Project Structure

- `src/background.ts` - extension background entrypoint
- `src/content.ts` - main content-script entrypoint
- `src/features/` - feature-specific logic
- `src/shared/` - shared YouTube helpers and messaging utilities
