# YT Utils

Chrome extension that marks YouTube videos as watched by seeking to the end, copying a share URL with timestamp, and redirecting.

## Setup

```sh
npm install && npm run build
```

Then load `extension/` as an unpacked extension in `chrome://extensions`.

## Scripts

- `npm run build` — production build
- `npm run dev` — build + watch
- `npm run typecheck` — type check

## Selector assumptions

If YouTube changes these controls, update `src/shared/youtube-dom.ts`:

- Share button: `aria-label="Share"`
- Share dialog: `tp-yt-paper-dialog` with share URL input + copy button
- Start-at checkbox: `#start-at-checkbox`
- Share URL: `#share-url`
- Copy button: `aria-label="Copy"`