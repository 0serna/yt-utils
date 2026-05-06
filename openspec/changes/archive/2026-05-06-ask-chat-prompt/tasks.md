## 1. Remove summarize chip code

- [x] 1.1 Remove `SUMMARIZE_LABELS` constant
- [x] 1.2 Remove `findSummarizeChip` function
- [x] 1.3 Remove `isSummarizeChipCandidate` function
- [x] 1.4 Remove `isEnabled` function
- [x] 1.5 Remove `matchesSummarizeLabel` function
- [x] 1.6 Remove `getElementText` function
- [x] 1.7 Remove `waitForSummarizeChip` function

## 2. Add chat prompt logic

- [x] 2.1 Add `SUMMARIZE_PROMPT` constant with the prompt text
- [x] 2.2 Add `findChatInput` function to locate the textbox (`role=textbox[name="Ask a question..."]`)
- [x] 2.3 Add `findSendButton` function to locate the Send button (`role=button[name="Send"]`)
- [x] 2.4 Add `typeAndSendPrompt` function that focuses the input, types the prompt with `keyboard.type()`, and clicks Send

## 3. Update openAskPanel flow

- [x] 3.1 Replace `waitForSummarizeChip` call in `openAskPanel` with `typeAndSendPrompt`
- [x] 3.2 Update error handling to match new behavior (silent on failure, mark complete)

## 4. Update tests

- [x] 4.1 Update `watch-panel-auto-open/content.test.ts` to reflect new behavior (mock chat input and Send button instead of summarize chip)

## 5. Verify

- [x] 5.1 Run `npm run check` (lint, typecheck, tests)
- [x] 5.2 Run `npm run build` to verify extension builds
