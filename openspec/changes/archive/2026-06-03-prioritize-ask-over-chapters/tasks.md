## 1. Ask-First Decision Flow

- [x] 1.1 Update `src/features/watch-panel-auto-open/content.ts` so the initial panel decision attempts Ask before Chapters for the current confirmed video.
- [x] 1.2 Wait within the existing configured panel decision window for Ask availability before falling back to Chapters.
- [x] 1.3 Treat an opened or already-expanded current-video Ask panel as completion even when the prompt input or Send button is unavailable.
- [x] 1.4 Ensure Chapters is only selected as fallback when Ask cannot be opened or confirmed within the wait window.

## 2. Session and User-Respectful Behavior

- [x] 2.1 Preserve current-video validation and stale wait invalidation before clicking controls, typing prompts, sending prompts, or completing a video.
- [x] 2.2 Preserve noisy panel cleanup during the initial decision while evaluating Ask before Chapters.
- [x] 2.3 Prevent automatic switching to Ask after Chapters has already completed as fallback for the video.
- [x] 2.4 Preserve auto-prompt behavior when the user manually opens Ask later in the same video session.

## 3. Tests and Validation

- [x] 3.1 Update tests so Ask is chosen when Ask and Chapters are both available.
- [x] 3.2 Add or update tests for Ask timeout followed by Chapters fallback.
- [x] 3.3 Add or update tests for already-expanded Chapters being superseded by Ask during the initial decision window.
- [x] 3.4 Add or update tests confirming missing Ask chat input leaves Ask open and does not fall back to Chapters.
- [x] 3.5 Add or update tests confirming late Ask availability after Chapters fallback does not switch panels automatically, while manual Ask opening still prompts.
- [x] 3.6 Run focused watch-panel tests and the repository check command.
