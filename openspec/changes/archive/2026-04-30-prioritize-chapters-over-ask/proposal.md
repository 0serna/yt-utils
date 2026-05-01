## Why

The current YouTube Ask auto-open behavior opens Ask whenever that UI is available, even when the video has chapters that would be more useful to surface first. Prioritizing chapters keeps the side panel focused on video navigation when YouTube exposes a real chapter list, while retaining Ask as a fallback for videos without chapters and making that fallback immediately useful by selecting the summarize option.

## What Changes

- Prefer opening the YouTube `Chapters`/`Capítulos` engagement panel when the current video exposes a real chapter list.
- Fall back to opening `Ask`/`Preguntar` when no valid chapters list becomes available within a short wait.
- When the extension opens Ask as the fallback, automatically click the enabled `Summarize the video`/`Resumir`/`Resumir el video` chip if it appears within a short wait.
- Preserve one automatic panel-opening attempt per current video and avoid reopening a panel the user has already closed.
- Keep support scoped to desktop YouTube watch pages and English/Spanish UI labels.

## Capabilities

### New Capabilities

- `youtube-watch-panel-priority`: Covers which YouTube engagement panel should be opened automatically when multiple candidate panels are available for the current watch-page video.

### Modified Capabilities

- `youtube-watch-panel-auto-open`: Chapters panel priority is inserted before Ask, and Ask becomes the fallback behavior when no valid chapters panel is available for the current video, selecting the summarize chip when available.

## Impact

- Affects `src/features/watch-panel-auto-open/content.ts` and related watch-page DOM detection logic.
- May add or adjust tests around panel priority, chapters detection, Ask fallback timing, summarize chip selection, and SPA navigation state.
- No new external dependencies, extension permissions, or public APIs are expected.
