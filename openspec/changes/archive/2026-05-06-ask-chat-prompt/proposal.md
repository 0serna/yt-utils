## Why

The Ask panel's "Summarize the video" chip sometimes generates summaries in non-chronological order, producing disorganized results. By typing a custom prompt into the chat input instead, we can explicitly request chronological ordering with timestamps and bulleted format, giving more control over the output quality.

## What Changes

- Replace the summarize chip click with typing a prompt into the Ask panel's chat input field and sending it
- Prompt text: `"Please summarize this video for me, including timestamps, in chronological order, and in a bulleted list format."`
- Remove all summarize chip detection logic (`findSummarizeChip`, `isSummarizeChipCandidate`, `waitForSummarizeChip`, `SUMMARIZE_LABELS`, and supporting helpers)
- No fallback to the chip — if the chat input is unavailable, the feature does nothing for that video

## Capabilities

### New Capabilities

_None_

### Modified Capabilities

- `youtube-watch-panel-auto-open`: The Ask panel fallback behavior changes from clicking the summarize chip to typing and sending a prompt via the chat input

## Impact

- `src/features/watch-panel-auto-open/content.ts` — main implementation file (~40 lines removed, ~20 lines added)
- No new dependencies, APIs, or external systems
- No breaking changes to other features
