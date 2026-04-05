## 1. Extension Scaffold

- [x] 1.1 Create the Manifest V3 extension structure, including `manifest.json` and the background service worker entrypoint.
- [x] 1.2 Declare the minimum Chrome permissions and host access needed to inspect the active tab, inject automation into YouTube watch pages, and redirect the current tab.

## 2. Action Trigger And Validation

- [x] 2.1 Implement the browser-action click handler that resolves the active tab and verifies the URL is a supported `youtube.com/watch` page.
- [x] 2.2 Add unsupported-page error handling so the automation does not run on non-watch YouTube pages or unrelated sites.

## 3. In-Page Automation Flow

- [x] 3.1 Implement the injected automation that seeks the current YouTube video to 99% progress and pauses playback only after the seek has settled.
- [x] 3.2 Implement ordered DOM automation for opening the Share dialog, enabling `Start at`, capturing the generated share URL from the dialog, and triggering the Copy URL action.
- [x] 3.3 Add bounded waits and structured failures for missing player controls, missing share-dialog controls, or an unavailable generated URL.

## 4. Redirect And Verification

- [x] 4.1 Send the generated share URL back to the extension layer and redirect the active tab to that URL only after the copy step succeeds.
- [x] 4.2 Verify the end-to-end flow manually on a standard YouTube watch page using a loaded unpacked extension and document any selector assumptions discovered during testing.
