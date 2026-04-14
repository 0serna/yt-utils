## Why

YouTube now exposes an `Ask` entry point on some watch pages that opens an AI chat panel on the right. Opening it manually every time adds friction, especially for the workflow this extension is already automating around the watch page.

## What Changes

- Automatically open the YouTube `Ask` panel when a supported watch page loads.
- Only trigger the opening once per video load so the feature does not fight the user after they close it.
- Do nothing on watch pages where the `Ask` panel is unavailable.

## Capabilities

### New Capabilities
- `youtube-ask-auto-open`: Automatically open the `Ask` chat panel on supported YouTube watch pages.

### Modified Capabilities
- 

## Impact

- Content script behavior on YouTube watch pages.
- DOM detection for the new `Ask` panel and its open/closed state.
- No new external dependencies are expected.
