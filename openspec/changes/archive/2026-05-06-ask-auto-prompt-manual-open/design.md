## Context

The `watch-panel-auto-open` feature monitors YouTube engagement panels via a DOM sync controller. When a watch page loads, it tries to open Chapters first, falling back to Ask with an auto-typed summary prompt. The auto-prompt only runs inside `openAskPanel()`, which is called when the panel is collapsed. If the user manually opens the Ask panel, the sync detects the expanded state but just marks the video complete without prompting.

## Goals / Non-Goals

**Goals:**

- Auto-prompt when the Ask panel is manually opened by the user (first time per video)
- Keep existing auto-open behavior unchanged
- Minimal state addition

**Non-Goals:**

- Changing the prompt content or making it configurable
- Prompting on every panel expansion (only first time per video)
- Handling the case where the user explicitly doesn't want a prompt

## Decisions

### Use `promptedVideoId` to track prompt state

**Choice**: Add a `promptedVideoId: string | null` variable alongside the existing `completedVideoId`.

**Alternatives considered**:

- _Check if chat input is empty_: Rejected — user might have intentionally left it empty, and "first time per video" is simpler
- _Check DOM for existing messages_: Fragile — depends on YouTube's internal DOM structure for message history
- _Use a Set of video IDs_: Overkill — only one video is active at a time, a single string suffices

**Rationale**: Mirrors the existing `completedVideoId` pattern. Simple, explicit, and the reset logic already exists in `resetStaleState`.

### Prompt in `openAskFallbackIfNeeded` when panel is already expanded

**Choice**: When `askExpanded` is true and `promptedVideoId !== videoId`, call `typeAndSendPrompt()` before completing.

**Alternatives considered**:

- _New function `promptIfUnprompted(videoId)`_: Would work but adds indirection for a 3-line check
- _Observer-based approach_: Separate mutation observer for manual opens — over-engineered for this scope

**Rationale**: The two branches in `openAskFallbackIfNeeded` (collapsed vs expanded) are mutually exclusive. Adding the prompt check to the expanded branch keeps the flow linear and readable.

### Set `promptedVideoId` in both paths

**Choice**: Set `promptedVideoId = videoId` after prompting in both `openAskFallbackIfNeeded` (expanded path) and `openAskPanel` (auto-open path).

**Rationale**: Defense in depth — if both paths somehow fire for the same video, the second one won't double-prompt.

## Risks / Trade-offs

- **[Risk] User opens panel and types prompt simultaneously** → The auto-prompt overwrites their input. Mitigation: This is acceptable per the "first time per video, no empty guard" decision. The user can re-type after.
- **[Risk] Race condition between auto-open and manual open** → Both paths could fire. Mitigation: `promptedVideoId` gate prevents double-prompting; `completedVideoId` prevents re-processing.
