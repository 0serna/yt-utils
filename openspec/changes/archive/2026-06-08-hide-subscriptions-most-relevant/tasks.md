## 1. DOM helpers

- [x] 1.1 Add a helper that finds `ytd-rich-shelf-renderer` elements titled `Most relevant` on the desktop subscriptions feed.
- [x] 1.2 Add a helper that removes each matching shelf's closest `ytd-rich-section-renderer` parent.

## 2. Feature implementation

- [x] 2.1 Create `src/features/subscriptions-most-relevant-removal/content.ts` following the existing `Feature` lifecycle pattern.
- [x] 2.2 Activate the feature only on `www.youtube.com/feed/subscriptions`.
- [x] 2.3 Remove matching shelves on activation and re-apply removal through a MutationObserver with `requestAnimationFrame` batching.
- [x] 2.4 Register the feature in `src/content.ts`.

## 3. Verification

- [x] 3.1 Add or update focused tests for detecting/removing the `Most relevant` shelf while preserving regular feed cards.
- [x] 3.2 Run the configured project checks.
- [x] 3.3 Manually validate on the current YouTube subscriptions tab after extension reload: `Most relevant` and its `Show more` control are gone, while chronological cards remain.
