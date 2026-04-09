## 1. Manifest

- [ ] 1.1 Update `manifest.json` `name` from `"Mark As Seen"` to `"YT Utils"`
- [ ] 1.2 Update `manifest.json` `description` to reflect the broader YouTube utilities scope
- [ ] 1.3 Update `manifest.json` `default_title` from `"Mark current YouTube video as seen"` to a `"YT Utils"`-scoped label

## 2. Background Service Worker

- [ ] 2.1 Update `INLINE_TRIGGER_MESSAGE` value from `"mark-as-seen:inline-trigger"` to `"yt-utils:inline-trigger"`
- [ ] 2.2 Update all `[mark-as-seen]` console log prefixes to `[YTUtils]`
- [ ] 2.3 Update `clearActionStatus` title string from `"Mark current YouTube video as seen"` to reflect the `YT Utils` name

## 3. Content Script

- [ ] 3.1 Update `INLINE_TRIGGER_MESSAGE` value from `"mark-as-seen:inline-trigger"` to `"yt-utils:inline-trigger"`
- [ ] 3.2 Update `BUTTON_HOST_ID` value from `"mark-as-seen-inline-host"` to `"yt-utils-inline-host"`
- [ ] 3.3 Update `BUTTON_ID` value from `"mark-as-seen-inline-button"` to `"yt-utils-inline-button"`
- [ ] 3.4 Update all `[mark-as-seen-inline]` console log prefixes to `[YTUtils:inline]`
- [ ] 3.5 Update accessible labels and title strings from `"Mark as seen"` / `"Marking as seen..."` / `"Marked as seen."` / `"Mark as seen failed."` to `"Mark as seen"` / `"Marking as seen..."` / `"Marked as seen."` / `"Mark as seen failed."` (feature labels remain the same — only project-scoped labels change)

## 4. README

- [ ] 4.1 Update the project title from `"# Mark As Seen"` to `"# YT Utils"`
- [ ] 4.2 Rewrite the description to present the project as a set of YouTube utilities with mark-as-seen as the first feature
- [ ] 4.3 Update all inline references from "Mark As Seen" / "mark-as-seen" to "YT Utils" / "yt-utils" where they describe the project identity (not the feature action)

## 5. Verification

- [ ] 5.1 Load the unpacked extension in Chrome and verify the extension appears as "YT Utils" in chrome://extensions
- [ ] 5.2 Open a YouTube watch page, verify the inline button appears with correct DOM IDs (`yt-utils-inline-host`, `yt-utils-inline-button`)
- [ ] 5.3 Trigger the mark-as-seen flow and verify the tab redirects correctly with no console errors referencing old names