## Context

The `watch-panel-auto-open` feature automatically opens the most useful YouTube engagement panel on watch pages. When chapters are unavailable, it falls back to opening the Ask panel and clicking the "Summarize the video" chip. This chip sometimes produces non-chronological summaries.

The Ask panel contains a chat input (`role=textbox[name="Ask a question..."]`) and a Send button (`role=button[name="Send"]`). Verified via Playwriter that `keyboard.type()` is required (not `fill()`) to properly enable the Send button.

## Goals / Non-Goals

**Goals:**

- Replace chip-click with a typed prompt that requests chronological, timestamped, bulleted summaries
- Maintain the same fire-and-forget behavior (no waiting for AI response)

**Non-Goals:**

- Adding user-configurable prompts
- Supporting multiple languages (English-only prompt)
- Waiting for or parsing the AI response
- Changing the chapters-first priority logic

## Decisions

### Use `keyboard.type()` instead of `fill()`

Playwriter validation showed that `fill()` does not trigger the input events YouTube uses to enable the Send button. `keyboard.type()` with a small delay correctly fires the events. This is the same pattern the codebase uses for `clickElement()` (dispatching real mouse events rather than calling `.click()`).

### No fallback to summarize chip

If the chat input or Send button is unavailable, the feature will silently leave the panel open and mark the video complete. This keeps the code simple and avoids maintaining two code paths. The chip fallback added complexity for a scenario that rarely occurs.

### Fire-and-forget semantics preserved

The current flow clicks the chip and immediately marks the video complete without waiting for the AI response. The new flow types the prompt, clicks Send, and marks complete — same lifecycle.

### Remove all chip-related code

`findSummarizeChip`, `isSummarizeChipCandidate`, `waitForSummarizeChip`, `SUMMARIZE_LABELS`, `isEnabled`, `matchesSummarizeLabel`, and `getElementText` are no longer needed. Removing them keeps the module focused and reduces maintenance surface.

## Risks / Trade-offs

- **[YouTube changes input selector]** → The textbox selector (`role=textbox[name="Ask a question..."]`) could change. Same risk as existing selectors. No mitigation beyond adapting when it breaks.
- **[Input type speed]** → If `delay` in `keyboard.type()` is too fast, YouTube may not register the input. Start with `delay: 50` (validated with Playwriter); adjustable if issues arise.
- **[Prompt effectiveness]** → The chosen prompt may not always produce perfectly ordered summaries. It's still an improvement over the chip which has no ordering instruction.
