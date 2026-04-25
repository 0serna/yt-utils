## Why

YouTube's engagement panels do not behave consistently when the user scrolls to a panel boundary. `Ask` already has local containment in this project, but `In this video`, `Chapters`, and related panel views can still leak wheel scrolling back to the underlying watch page and break the panel-focused reading flow.

## What Changes

- Add engagement-panel scroll containment for supported YouTube watch-page side panels so wheel scrolling stays inside the active panel when it reaches its scroll boundary.
- Apply the same containment behavior across panel variants that swap different internal scroll containers, including `Ask`, `In this video`, `Chapters`, and `Transcript` views when present.
- Keep the implementation resilient to YouTube rerendering or replacing panel internals during SPA navigation and tab switching.

## Capabilities

### New Capabilities

- `youtube-engagement-panel-scroll-containment`: Contain scrolling within active YouTube watch-page engagement panels so panel interaction does not scroll the underlying page.

### Modified Capabilities

## Impact

- Content-script behavior on YouTube watch pages.
- DOM detection for active `ytd-engagement-panel-section-list-renderer` surfaces and their effective scroll containers.
- Feature registration and watch-page mutation handling in `src/content.ts` and `src/features/*`.
- No new external dependencies are expected.
