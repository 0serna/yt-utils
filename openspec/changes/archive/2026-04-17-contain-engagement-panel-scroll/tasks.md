## 1. Panel Containment Feature

- [x] 1.1 Add a dedicated watch-page feature for engagement-panel scroll containment instead of extending the Ask auto-open feature.
- [x] 1.2 Implement detection of the expanded `ytd-engagement-panel-section-list-renderer` and selection of its primary content scroll container while excluding nested mini-scrollers such as textareas.
- [x] 1.3 Apply idempotent `overscroll-behavior-y: contain` syncing to the detected primary panel scroller.

## 2. Lifecycle Integration

- [x] 2.1 Register the new feature in the content-script feature registry so it runs on supported YouTube watch pages.
- [x] 2.2 Re-sync containment when YouTube rerenders panel internals, swaps panel views such as `Chapters` and `Transcript`, or navigates between watch-page videos.
- [x] 2.3 Preserve existing Ask auto-open behavior while avoiding global document-level scroll interception.

## 3. Verification

- [x] 3.1 Verify manually on `Ask`, `In this video`, `Chapters`, and `Transcript` that wheel scrolling stays inside the panel at scroll boundaries and does not move the watch page.
- [x] 3.2 Run the project's configured checks after implementation and fix any issues needed for the change to ship cleanly.
