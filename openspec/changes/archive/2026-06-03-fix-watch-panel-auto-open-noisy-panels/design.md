## Context

The existing `youtube-watch-panel-auto-open` feature runs on supported desktop YouTube watch pages after the live player confirms the current URL video ID. It prioritizes opening Chapters/Capítulos when valid chapter items are available, otherwise falls back to opening Ask/Preguntar and sending a summary prompt.

YouTube also exposes an `In this video` surface through the player chapter-title entrypoint. On some videos this surface opens a Timeline/Transcript engagement panel rather than the valid Chapters panel expected by the extension. The current auto-open flow can treat that ambiguous entrypoint as a Chapters candidate before Ask fallback. YouTube can also leave or open unrelated panels during navigation, causing the desired Ask or Chapters panel to coexist with noisy panels.

## Goals / Non-Goals

**Goals:**

- Treat `In this video` / Timeline / Transcript composite panels as noise, not as valid Chapters.
- Only allow real Chapters evidence to preempt Ask fallback.
- Close noisy expanded `In this video` and opened `Live chat replay` panels during the current video's initial auto-open attempt.
- Preserve user agency after the initial auto-open attempt completes or is exhausted.
- Keep the behavior within the existing confirmed-video/session guards.

**Non-Goals:**

- Do not add a separately registered feature for panel cleanup.
- Do not enforce one-panel exclusivity between Ask and valid Chapters.
- Do not hide or remove the passive `Live chat replay` teaser/card with an `Open panel` button.
- Do not close unrelated manual panels such as Description, standalone Transcript, Clip, Comments, or future unknown panels outside the initial auto-open attempt.
- Do not add new permissions, storage, external services, or dependencies.

## Decisions

### Keep cleanup inside `watch-panel-auto-open`

The noisy-panel cleanup is active only while the auto-open attempt for a confirmed video is in progress. Keeping it inside `watch-panel-auto-open` lets it reuse the existing `sessionToken`, current-video validation, completion state, and SPA navigation invalidation.

Alternative considered: a separate registered feature. Rejected because it would need coordination with auto-open completion state, or it would become a permanent panel closer that conflicts with manual panel usage.

### Make Chapters detection conservative

Valid Chapters should require evidence of the expected Chapters panel and visible `ytd-macro-markers-list-item-renderer` items. Ambiguous `button.ytp-chapter-title` entrypoints and `In this video` text alone should not count as valid Chapters and should not block Ask fallback.

Alternative considered: continue clicking the player chapter-title button and close `In this video` if it appears. Rejected because it can introduce flicker, delay Ask fallback, and still treats a noisy surface as part of the preferred path.

### Close noisy panels only during the initial auto-open attempt

Noisy expanded panels should be closed while evaluating/opening Ask or Chapters for the current video, including panels inherited from a previous SPA watch session. Once the auto-open attempt marks the video complete or exhausts available actions, cleanup should stop for that video.

Alternative considered: continuously close `In this video` and `Live chat replay` whenever they appear. Rejected because the user may intentionally open those panels after the extension completes its automatic setup.

### Close via visible Close controls

When cleanup identifies a noisy expanded panel, it should close the panel by activating its visible Close control. If no close control is available, the panel should be left unchanged rather than mutating YouTube's internal attributes.

Alternative considered: directly changing `visibility`, `hidden`, or styles. Rejected because it risks desynchronizing YouTube's internal state and causing rerender issues.

## Risks / Trade-offs

- [YouTube changes panel text or structure] → Use multiple conservative signals where available, keep the cleanup scoped to expanded panels, and leave unknown panels untouched.
- [Live chat replay opened-panel DOM differs from the observed teaser DOM] → Detect only clear expanded-panel instances with a visible close control; otherwise do nothing.
- [Cleanup closes a panel the user opened just before auto-open completes] → Scope cleanup to the initial attempt only and stop immediately when the auto-open session completes or exhausts actions.
- [Conservative Chapters detection misses a legitimate Chapters entrypoint] → Ask fallback still provides a useful panel, and true Chapters remain supported when visible chapter items are confirmed.
