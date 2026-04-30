## 1. Message Contract

- [x] 1.1 Add background-to-content mark-as-seen automation request and response message types using the `yt-utils:` prefix
- [x] 1.2 Add type guards and result normalization for the new automation message path

## 2. Content Automation

- [x] 2.1 Move mark-as-seen automation execution into content-script code that can import shared helpers
- [x] 2.2 Replace duplicated local wait/error/delay helpers with shared helper usage where appropriate
- [x] 2.3 Preserve the seek-to-99-percent, brief-playback, and pause sequence

## 3. Background Orchestration

- [x] 3.1 Update the background handler to validate supported watch page URLs before sending the content automation request
- [x] 3.2 Replace `chrome.scripting.executeScript({ func })` usage with content-script messaging
- [x] 3.3 Preserve action badge success/failure status behavior and clear unsupported-page failure reporting

## 4. Verification

- [x] 4.1 Run `npm run check` and confirm the injected automation duplicate groups are removed
- [x] 4.2 Run `npm run build`
- [x] 4.3 Manually validate extension action mark-as-seen and inline button mark-as-seen on a supported YouTube watch page
- [x] 4.4 Run `openspec validate refactor-mark-as-seen-injected-automation --strict`
