## Why

The YouTube `Ask` panel is useful only if its scroll behavior stays contained inside the chat. Today, once the chat reaches its top or bottom boundary, wheel scrolling can leak through to the underlying YouTube page, which breaks the reading/chatting flow.

## What Changes

- Keep wheel and scroll gestures inside the `Ask` panel when the chat reaches its scroll boundary.
- Prevent the underlying YouTube watch page from scrolling while the user is interacting with the `Ask` chat.
- Preserve the existing auto-open behavior for the `Ask` panel.

## Capabilities

### New Capabilities

-

### Modified Capabilities

- `youtube-ask-auto-open`: The `Ask` panel must contain its own scrolling and must not leak scroll to the page when its content reaches the top or bottom boundary.

## Impact

- Content script behavior on YouTube watch pages.
- DOM handling around the `Ask` engagement panel scroll container.
- No new external dependencies are expected.
