## 1. Detection Model

- [x] 1.1 Identify the current YouTube DOM selectors for the `Chapters`/`Capítulos` engagement panel, entrypoint control, and visible chapter-list items.
- [x] 1.2 Add helper logic in the existing auto-open feature to find visible chapter controls and confirm a real visible chapter list.
- [x] 1.3 Keep Ask detection available as a fallback path after chapters detection fails or times out.
- [x] 1.4 Add helper logic to find a visible enabled Ask summarize chip matching `Summarize the video`, `Resumir`, or `Resumir el video`.

## 2. Panel Priority Flow

- [x] 2.1 Refactor the current Ask-only sync flow into a current-video panel decision that evaluates chapters before Ask.
- [x] 2.2 Open the chapters panel when a valid chapter list is available and mark the current video complete after successful expansion.
- [x] 2.3 Wait up to the configured sync timeout for chapters before opening Ask when Ask is available.
- [x] 2.4 After the extension opens Ask as fallback, wait up to the configured sync timeout for the enabled summarize chip and click it once when available.
- [x] 2.5 Mark the current video complete after the summarize chip is clicked or after the summarize chip wait times out.
- [x] 2.6 Preserve existing per-video state reset behavior across YouTube SPA navigation.

## 3. Verification

- [x] 3.1 Add or update tests for chapters priority when both chapters and Ask are available.
- [x] 3.2 Add or update tests for Ask fallback when chapters are absent, empty, or fail to become valid within the wait window.
- [x] 3.3 Add or update tests for summarize chip selection after Ask fallback opens.
- [x] 3.4 Add or update tests for no summarize click when Ask was already open or when no enabled summarize chip appears within the wait window.
- [x] 3.5 Add or update tests for no-op behavior when neither chapters nor Ask is available.
- [x] 3.6 Run `npm run check` and fix any reported issues.
