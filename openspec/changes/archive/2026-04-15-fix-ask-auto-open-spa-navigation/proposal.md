## Why

The Ask auto-open feature can miss newly selected videos during YouTube SPA navigation because the previous video's expanded Ask panel may linger in the DOM. This causes the feature to treat stale UI as if it belongs to the new video and skip opening Ask for the current watch session.

## What Changes

- Tighten Ask auto-open behavior so a newly navigated video is not marked complete from a stale expanded panel left over from the previous video.
- Require the feature to wait for current-video Ask UI to settle before deciding whether Ask is already open or needs to be opened.
- Preserve the existing behavior that avoids reopening Ask after the user manually closes it during the same video session.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `youtube-ask-auto-open`: Refine SPA navigation behavior so stale Ask UI from the previous video does not suppress auto-open on the current video.

## Impact

- Affected code: `src/features/ask-auto-open/content.ts`
- Related systems: YouTube watch-page SPA navigation lifecycle, DOM observation, and Ask panel state detection
- User impact: Ask should reliably auto-open again after navigating between videos without a full page reload
