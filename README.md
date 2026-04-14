# YT Utils

YT Utils is a Chrome extension for YouTube. It currently focuses on watch-page helpers.

## Features

- Marks videos as watched.
- Provides playback speed utilities.

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
- `src/content.ts` - main content-script entrypoint
- `src/features/` - feature-specific logic
- `src/shared/` - shared YouTube helpers and messaging utilities
