## Why

The current watch-panel auto-open behavior prioritizes Chapters when both Chapters and Ask are available. The desired workflow now favors YouTube Ask summaries first, while still keeping Chapters useful as a fallback when Ask is unavailable.

## What Changes

- Change the watch-page panel auto-open priority from Chapters-first to Ask-first.
- Wait for Ask availability within the existing panel decision window before falling back to Chapters.
- Keep the typed Ask summary prompt behavior when Ask opens or is already open.
- Use Chapters only when Ask is not available within the configured wait window.
- Preserve current safeguards for current-video confirmation, SPA navigation staleness, noisy panel cleanup, and user-respectful one-decision-per-video behavior.

## Capabilities

### New Capabilities

### Modified Capabilities

- `youtube-watch-panel-auto-open`: Change the prioritized engagement panel decision so Ask is preferred over Chapters, with Chapters becoming the fallback when Ask is unavailable.

## Impact

- Affects `src/features/watch-panel-auto-open/content.ts` panel decision ordering and per-video completion behavior.
- Affects `src/features/watch-panel-auto-open/content.test.ts` characterization around Ask/Chapters priority, Ask timeout fallback, already-open panel handling, and manual Ask prompting.
- Updates the `youtube-watch-panel-auto-open` OpenSpec requirement language and scenarios.
