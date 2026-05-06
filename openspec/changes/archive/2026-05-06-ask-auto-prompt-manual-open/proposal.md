## Why

The Ask panel auto-prompt currently only fires when the extension itself opens the panel as a fallback. When the user manually opens the Ask panel, the summary prompt is never typed — the user has to type it themselves, defeating the purpose of the automation.

## What Changes

- Track whether the summary prompt has been typed for the current video (`promptedVideoId`)
- When the Ask panel is detected as expanded and the prompt hasn't been typed yet for this video, automatically type and send the summary prompt
- This applies regardless of how the panel was opened: automatically by the extension, or manually by the user

## Capabilities

### Modified Capabilities

- `youtube-watch-panel-auto-open`: The "Current video's Ask panel is already open" scenario changes — instead of just marking the video complete, the system now also types the summary prompt if it hasn't been typed yet for this video.

## Impact

- `src/features/watch-panel-auto-open/content.ts`: Add `promptedVideoId` state, modify `openAskFallbackIfNeeded` to prompt when panel is already expanded, reset state in `resetStaleState` and `deactivate`
- `src/features/watch-panel-auto-open/content.test.ts`: Add test for manual-open prompting behavior
