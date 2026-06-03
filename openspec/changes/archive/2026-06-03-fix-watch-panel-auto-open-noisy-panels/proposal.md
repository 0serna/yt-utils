## Why

The watch-panel auto-open flow can misclassify YouTube's `In this video`/Timeline surface as Chapters, leaving the intended Ask fallback unopened or delayed. YouTube can also leave noisy engagement panels open during the initial watch-page flow, making the desired Ask or Chapters panel compete with unrelated panels.

## What Changes

- Tighten Chapters detection so ambiguous `ytp-chapter-title` / `In this video` entrypoints do not count as valid Chapters unless real visible chapter items are confirmed.
- During the initial auto-open attempt for a confirmed watch-page video, close noisy expanded panels such as `In this video` and opened `Live chat replay` panels.
- Keep `Ask` and valid `Chapters` panels open when present, and do not enforce exclusivity between those allowed panels.
- Stop the noisy-panel cleanup when the auto-open attempt for the current video completes or is exhausted, so later manual panel usage is preserved.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `youtube-watch-panel-auto-open`: refine prioritized panel selection and initial-session cleanup so only valid Chapters can preempt Ask, while noisy expanded panels are closed during the auto-open attempt.

## Impact

- Affects the watch-page panel auto-open content feature under `src/features/watch-panel-auto-open/`.
- Adds or updates tests for ambiguous `In this video` entrypoints, noisy expanded panel cleanup, stale panel cleanup after SPA navigation, and preservation of manual panel usage after auto-open completion.
- No new permissions, APIs, storage keys, or dependencies are expected.
