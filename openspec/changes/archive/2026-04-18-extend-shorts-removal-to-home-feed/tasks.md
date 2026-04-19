## 1. Shared DOM support

- [x] 1.1 Add or extend a shared desktop-feed page matcher in `src/shared/youtube-dom.ts` that covers both `www.youtube.com/feed/subscriptions` and `www.youtube.com/`
- [x] 1.2 Update the shared Shorts-removal helper in `src/shared/youtube-dom.ts` to remove every matching `ytd-rich-shelf-renderer[is-shorts]` section on the current page

## 2. Shorts-removal feature update

- [x] 2.1 Update `src/features/subscriptions-shorts-removal/content.ts` so `matchesPage()` activates on supported desktop feed pages, including home
- [x] 2.2 Keep the existing activation, observation, and cleanup flow intact while applying Shorts removal across subscriptions and home feed rerenders

## 3. Verification

- [x] 3.1 Verify that Shorts shelves are removed on initial load and SPA navigation for `https://www.youtube.com/feed/subscriptions`
- [x] 3.2 Verify that Shorts shelves are removed on initial load and SPA navigation for `https://www.youtube.com/`
- [x] 3.3 Verify that unsupported surfaces remain unaffected and regular non-Shorts video cards continue to render normally
