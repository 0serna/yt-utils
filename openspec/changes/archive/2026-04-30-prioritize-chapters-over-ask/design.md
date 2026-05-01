## Context

The existing `youtube-watch-panel-auto-open` content feature runs on desktop YouTube watch pages, waits for the current player video ID to match the URL video ID, and opens the most useful engagement panel once per video (Chapters first, Ask as fallback). The new behavior needs to keep that safety model while inserting a higher-priority `Chapters`/`Capítulos` panel path when YouTube exposes a real chapter list for the current video. When Ask remains the fallback, the feature should select YouTube's summarize chip so the opened Ask panel immediately starts the intended summary flow.

YouTube's DOM is not a stable API, so the implementation should continue to rely on guarded DOM detection, visible controls, engagement panel visibility attributes, and silent retry/fallback behavior rather than hard failures.

## Goals / Non-Goals

**Goals:**

- Open the native side-panel chapters UI before Ask when the current video has a usable chapter list.
- Fall back to Ask when chapters are not available or cannot be confirmed within the configured wait window, then click the enabled summarize chip when it appears.
- Keep one automatic opening decision per video and avoid repeatedly reopening panels after user interaction.
- Preserve current desktop watch-page scoping, SPA navigation handling, and English/Spanish label support.

**Non-Goals:**

- Building a custom chapters UI or parsing chapters from the video description.
- Typing a custom prompt into Ask or waiting for the generated summary response.
- Supporting mobile YouTube layouts.
- Adding broad localization beyond English and Spanish labels in this change.
- Changing extension permissions or adding external dependencies.

## Decisions

- Use a panel-priority flow inside the existing auto-open feature rather than a separate feature. This keeps the current per-video lifecycle, DOM observer, player snapshot validation, and completion state in one place. A separate feature would add coordination risk because both features could attempt to open competing engagement panels.
- Treat chapters as valid only after confirming visible chapter content, not merely the presence of a button or panel. YouTube may expose controls before content is hydrated, and opening Ask should remain the fallback when no usable chapters list appears.
- Wait up to the existing `SYNC_TIMEOUT_MS` window before falling back to Ask when chapters are not yet confirmed. This reuses the current timing scale, avoids opening Ask too early on slow YouTube hydration, and prevents indefinite delay.
- After the extension opens Ask as the fallback, wait up to `SYNC_TIMEOUT_MS` for a visible enabled summarize chip and click it when found. The target chip should match the Ask chip structure, including `button.ytwYouChatChipsDataChip` where present, and summary labels in English or Spanish.
- Do not select summarize when Ask was already open before the extension's fallback click. This avoids acting inside a panel the user opened or left open manually.
- Keep label matching scoped to `Chapters`/`Capítulos`, `Ask`/`Preguntar`, and `Summarize the video`/`Resumir`/`Resumir el video`, augmented by structural selectors where available. This matches current localization scope and reduces false positives.
- Mark the current video complete after a successful automatic opening of chapters, or after the Ask fallback has either clicked the summarize chip or failed to find an enabled summarize chip within the wait window. This preserves the existing user-respectful behavior of not re-opening panels repeatedly for the same video.

## Risks / Trade-offs

- YouTube selector drift may break chapters detection -> Use defensive selectors, visibility checks, and Ask fallback rather than assuming a single DOM shape.
- Chapters may hydrate later than the timeout -> The feature may fall back to Ask for a video that eventually shows chapters; the five-second wait balances correctness with responsiveness.
- A visible chapters control may not map cleanly to real chapter content -> Confirm visible chapter list content before considering chapters available.
- The summarize chip may hydrate after the timeout or use different localized copy -> Restrict automatic clicks to known enabled summary chips and leave Ask open without retrying when no match appears.
- A generic Ask chip selector could match another suggested prompt -> Require summary label matching in addition to chip visibility and enabled state.
- Existing Ask scroll containment logic is panel-specific -> Keep generic engagement panel containment behavior as the safety net and only retain Ask-specific containment where still needed.
