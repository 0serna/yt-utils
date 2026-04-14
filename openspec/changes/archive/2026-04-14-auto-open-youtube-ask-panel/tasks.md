## 1. Feature Wiring

- [x] 1.1 Add a new watch-page content feature for auto-opening the YouTube `Ask` panel.
- [x] 1.2 Register the new feature in the content feature registry so it activates with the other watch-page utilities.

## 2. Ask Panel Detection and Control

- [x] 2.1 Detect the `Ask` panel using the `PAyouchat` engagement panel target and its visibility state.
- [x] 2.2 Click the `Ask` control only when the panel is hidden and the current video has not already been handled.
- [x] 2.3 Track per-video session state so the panel is not reopened after a manual close until the next navigation.

## 3. Verification

- [x] 3.1 Validate the feature on a YouTube watch page where `Ask` is available and confirm the panel opens automatically.
- [x] 3.2 Validate that pages without `Ask` do not error and that manually closing the panel prevents reopening in the same session.
- [x] 3.3 Run the repo checks relevant to the touched files and fix any regressions.
