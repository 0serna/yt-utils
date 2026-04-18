## 1. Shared DOM Helpers

- [x] 1.1 Add `findShortsShelf()` function to `src/shared/youtube-dom.ts` that returns the `ytd-rich-shelf-renderer[is-shorts]` element
- [x] 1.2 Add `removeShortsSection()` function to `src/shared/youtube-dom.ts` that removes the parent `ytd-rich-section-renderer` of the shorts shelf

## 2. Content Feature

- [x] 2.1 Create `src/features/subscriptions-shorts-removal/content.ts` implementing the `Feature` interface with `matchesPage`, `activate`, `deactivate`
- [x] 2.2 Implement shorts shelf detection and removal logic using the shared DOM helpers
- [x] 2.3 Add `MutationObserver` with `requestAnimationFrame` batching to re-apply removal on feed rerenders
- [x] 2.4 Clean up observer and state on `deactivate`

## 3. Registration

- [x] 3.1 Import and register the new feature in `src/content.ts`
