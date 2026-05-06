## 1. State Management

- [x] 1.1 Add `promptedVideoId: string | null` state variable alongside `completedVideoId`
- [x] 1.2 Reset `promptedVideoId` in `resetStaleState()` when video changes
- [x] 1.3 Clear `promptedVideoId` in `deactivate()`

## 2. Auto-prompt on Manual Open

- [x] 2.1 Modify `openAskFallbackIfNeeded()` to call `typeAndSendPrompt()` when `askExpanded` is true and `promptedVideoId !== videoId`
- [x] 2.2 Set `promptedVideoId = videoId` after prompting in `openAskFallbackIfNeeded()`
- [x] 2.3 Set `promptedVideoId = videoId` after prompting in `openAskPanel()` for defense in depth

## 3. Tests

- [x] 3.1 Add test: manual open triggers prompt when `promptedVideoId` is null
- [x] 3.2 Add test: manual open does NOT re-prompt when `promptedVideoId` matches current video
- [x] 3.3 Verify existing tests still pass
