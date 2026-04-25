## Why

YouTube does not provide a direct way to manually mark a video as fully watched. This change adds a Chrome extension that automates a repeatable sequence on a YouTube watch page so a user can mark the current video as seen with a single click.

## What Changes

- Add a Chrome extension that runs from the browser action while the active tab is on a YouTube video URL.
- Automate the watch-page flow: seek the current video to 99% progress, pause playback, open the Share dialog, enable the `Start at` option, copy the generated URL, and redirect the tab to that copied URL.
- Prevent the automation from running on non-video YouTube pages and surface clear failure handling when required page controls are unavailable.
- Define the extension architecture, required permissions, and implementation tasks needed to ship and test the feature.

## Capabilities

### New Capabilities

- `youtube-watch-marking-extension`: A Chrome extension can detect a YouTube watch page and automate the share-link redirection flow that causes the current video to be marked as watched.

### Modified Capabilities

None.

## Impact

- Adds a new Chrome extension codebase, including the extension manifest and action-triggered automation logic.
- Requires Chrome extension permissions for interacting with the active tab and YouTube watch pages.
- Introduces behavior that depends on YouTube's current DOM structure and share dialog controls.
