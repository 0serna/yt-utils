# YT Utils

A set of YouTube utilities delivered as a Chrome extension. The first utility, **Mark as Seen**, automates marking a YouTube video as watched by completing the share-link redirect flow.

## How it works

When you click the extension action on a supported `youtube.com/watch` page, the extension:

1. Seeks the current video to 99% of its duration.
2. Pauses the video after the seek settles.
3. Opens the YouTube `Share` dialog.
4. Enables the `Start at` checkbox.
5. Clicks `Copy`.
6. Redirects the current tab to the generated share URL.

## Load locally

1. Open `chrome://extensions`.
2. Enable `Developer mode`.
3. Click `Load unpacked`.
4. Select the `extension/` folder inside this repository.

## Manual verification checklist

1. Open a standard YouTube watch URL such as `https://www.youtube.com/watch?v=dQw4w9WgXcQ`.
2. Let the player metadata load.
3. Click the `Mark As Seen` action on the YT Utils extension.
4. Confirm the tab redirects to a `youtu.be/...` URL that includes a start-time query parameter.
5. Confirm the video appears as watched in YouTube history or progress UI.

## Selector assumptions

These selectors were validated against a live YouTube watch page during implementation and also have text-based fallbacks in code:

- Share button: accessible button with `aria-label="Share"`.
- Share dialog: visible `tp-yt-paper-dialog` containing a share URL input and a copy button.
- Start-at checkbox: `#start-at-checkbox` with accessible label `Start at`.
- Share URL field: readonly input `#share-url`.
- Copy button: accessible button with `aria-label="Copy"`.

If YouTube changes these controls, update the selectors in `extension/background.js`.

## Verification notes

- The live YouTube DOM flow was exercised during implementation against `https://www.youtube.com/watch?v=dQw4w9WgXcQ`.
- The verified result was a generated redirect URL in the form `https://youtu.be/...&t=210` after seeking near the end and enabling `Start at`.
- Loading the unpacked extension through `chrome://extensions` still needs one local click-through because the browser automation session cannot complete the native directory picker.
- The unpacked path to choose is `extension/`, which now contains the extension manifest and service worker.
