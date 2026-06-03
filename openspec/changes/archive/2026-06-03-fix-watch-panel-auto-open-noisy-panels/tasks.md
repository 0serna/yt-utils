## 1. Chapters detection

- [x] 1.1 Update `watch-panel-auto-open` so ambiguous `button.ytp-chapter-title` / `In this video` entrypoints do not count as valid Chapters without confirmed visible chapter items.
- [x] 1.2 Preserve existing valid Chapters behavior when the Chapters/Capítulos panel contains visible `ytd-macro-markers-list-item-renderer` items.

## 2. Initial noisy-panel cleanup

- [x] 2.1 Add scoped noisy-panel detection inside `watch-panel-auto-open` for expanded `In this video` / Timeline / Transcript composite panels.
- [x] 2.2 Add scoped noisy-panel detection for opened `Live chat replay` panels while leaving passive teaser/card surfaces untouched.
- [x] 2.3 Close detected noisy panels through visible close controls only, without mutating YouTube panel attributes directly.
- [x] 2.4 Stop noisy-panel cleanup once the current video's auto-open attempt completes or exhausts available actions.

## 3. Session and navigation behavior

- [x] 3.1 Ensure noisy panels inherited from a previous SPA video are closed during the new confirmed video's initial auto-open attempt.
- [x] 3.2 Ensure stale waits from previous videos still cannot click controls, type prompts, send prompts, close panels, or mark the new video complete.
- [x] 3.3 Ensure manual `In this video` or `Live chat replay` panel usage after auto-open completion is not closed by the completed session.

## 4. Verification

- [x] 4.1 Add or update unit tests for ambiguous `In this video` surfaces falling through to Ask fallback.
- [x] 4.2 Add or update unit tests for noisy `In this video` and opened `Live chat replay` cleanup during initial auto-open.
- [x] 4.3 Add or update unit tests for passive `Live chat replay` teaser preservation and post-completion manual panel preservation.
- [x] 4.4 Run the repository check suite and confirm OpenSpec validation passes.
