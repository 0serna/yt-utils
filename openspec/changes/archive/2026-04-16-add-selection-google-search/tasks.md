## 1. Extension wiring

- [x] 1.1 Expand the manifest permissions and content-script registrations so a new global selection content entrypoint runs on supported webpages while the existing YouTube scripts remain scoped to YouTube.
- [x] 1.2 Add a dedicated background message contract and handler that opens a Google search URL in a new tab for a provided selected-text query.

## 2. Global selection feature

- [x] 2.1 Implement a self-contained global selection controller that detects eligible document selections and eligible `input`/`textarea` selections.
- [x] 2.2 Implement the floating Google-search icon UI, including immediate display, source-appropriate positioning, repositioning on selection changes, and teardown when the selection loses context.
- [x] 2.3 Wire the floating action to send the active selected text to the background worker and preserve the current page tab when opening search results.

## 3. Documentation and validation

- [x] 3.1 Update README and related extension copy so the project scope and broader page access are documented accurately.
- [x] 3.2 Run `npm run check` and `npm run build`, then manually verify that existing YouTube-only features still load on YouTube and the new inline search action appears on a normal webpage selection.
