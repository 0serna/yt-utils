## Context

The `youtube-watch-panel-auto-open` feature currently runs on supported desktop YouTube watch pages, waits for the live player to confirm the URL video ID, closes interfering noisy panels during the initial decision, then chooses a panel once per video session. Its current priority is Chapters/Capítulos first when a valid chapter list can be confirmed, with Ask/Preguntar as the fallback that opens the chat panel and types a summary prompt.

The desired behavior reverses that priority: Ask summaries are now the preferred workflow, while Chapters remains useful when Ask is unavailable. The feature must keep the existing current-video safety model because YouTube watch pages are SPA surfaces where stale panels and pending waits can outlive a video navigation.

## Goals / Non-Goals

**Goals:**

- Prefer Ask over Chapters for the current confirmed watch-page video.
- Wait within the existing panel decision window for Ask before falling back to Chapters.
- Keep the typed Ask summary prompt behavior for automatically opened Ask panels and manually opened Ask panels.
- Preserve per-video completion semantics so the extension does not repeatedly switch panels or fight the user.
- Preserve stale-session checks and noisy panel cleanup during the initial auto-open decision.

**Non-Goals:**

- Changing the summary prompt text or how the prompt is typed.
- Opening both Ask and Chapters automatically for the same initial decision.
- Retrying Ask after Chapters has already been selected as fallback for the video.
- Broadening support beyond existing YouTube watch-page surfaces or localization labels.
- Refactoring unrelated feature registry, scroll containment, or player session code.

## Decisions

### Treat Ask as the first panel decision within the existing wait window

The feature should attempt to detect or open Ask before evaluating Chapters. If Ask is hidden but available, it should click the Ask control, wait for the expanded panel, type the prompt when the input is available, and mark the video complete. If Ask is already expanded for the current confirmed video, the feature should type the prompt when needed and mark the video complete.

Alternative considered: only use Ask when it is immediately available, then fall back to Chapters. Rejected because YouTube often hydrates panel UI asynchronously; using the existing wait-window concept keeps behavior resilient.

### Define Ask availability by panel/control availability, not prompt success

Once Ask opens or is confirmed expanded, the feature should not fall back to Chapters just because the chat input or Send button is unavailable. It should leave Ask open and mark the video complete after the prompt attempt path exhausts, matching the current silent-failure behavior for missing chat controls.

Alternative considered: fall back to Chapters when prompt typing fails. Rejected because the chat input can appear late, and switching panels after Ask opens could interrupt or hide the user’s desired Ask surface.

### Use Chapters as the bounded fallback

If Ask cannot be opened or confirmed within the configured wait window, the feature should then evaluate Chapters. Chapters should still require visible `ytd-macro-markers-list-item-renderer` items before being treated as valid. Ambiguous `In this video`, Timeline, Transcript, and live chat replay surfaces remain noisy/interfering panels rather than valid fallback targets.

Alternative considered: keep waiting indefinitely for Ask because it has priority. Rejected because the feature should make one bounded automatic decision per video and avoid hanging forever on missing YouTube UI.

### Keep one automatic decision per video, with manual Ask prompt exception

After Ask is selected, user closure should not trigger Chapters. After Chapters is selected as fallback, late Ask hydration should not automatically switch the panel. However, if the user manually opens Ask later in the same video and the prompt has not been sent, the feature should still type and send the prompt as it does today.

Alternative considered: always switch to Ask whenever it later appears. Rejected because late automatic panel changes are surprising and can fight the user.

## Risks / Trade-offs

- [Ask hydrates just after the timeout] → Chapters may be selected even though Ask later becomes available; this is accepted to keep the decision bounded and predictable.
- [Chapters is already expanded on load] → Ask may still take priority within the initial decision window, which can change the visible panel; this is accepted because Ask-first is the requested priority.
- [Chat input selector drifts] → Ask may open without sending the prompt; preserve silent failure and leave Ask open rather than adding brittle secondary prompt paths.
- [YouTube stale SPA panels linger] → Continue using current-video confirmation and token/session invalidation before clicking controls, typing prompts, or marking a video complete.
