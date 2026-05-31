## 1. Watch Video Session Model

- [x] 1.1 Add tests for watch-page session identity using URL `v` changes versus same-video URL parameter changes.
- [x] 1.2 Implement or centralize helpers that read the current supported watch video ID from the URL and confirm it against the live player/bridge snapshot.
- [x] 1.3 Update feature-registry lifecycle logic so supported watch-page features reset on `v` changes but not on same-video URL noise.

## 2. Stale Async Work Protection

- [x] 2.1 Add tests showing previous-video async completions cannot affect the new video after SPA navigation.
- [x] 2.2 Update the shared DOM sync/session-token flow so video changes invalidate pending watch-page sync work immediately.
- [x] 2.3 Ensure completion paths re-check current token and current confirmed video before mutating state or acting on the page.

## 3. Watch-Page Feature Behavior

- [x] 3.1 Update Chapters/Ask auto-open tests for SPA navigation with stale panels, confirmed current video, and stale wait completion.
- [x] 3.2 Update Chapters/Ask auto-open logic to reset per-video state on `v` changes and act only for the confirmed current video.
- [x] 3.3 Update subtitle-policy tests for URL/player mismatch, new-video reset after manual override, and stale apply completion.
- [x] 3.4 Update subtitle-policy logic to apply only for confirmed current videos and ignore stale previous-video work.
- [x] 3.5 Update playback-speed tests for SPA video changes, URL/player mismatch, and stale speed initialization.
- [x] 3.6 Update playback-speed logic to initialize per confirmed video and ignore stale previous-video work.

## 4. Reliable Feature Logging

- [x] 4.1 Add tests that concurrent lifecycle log events are all preserved in `yt-utils:logs`.
- [x] 4.2 Serialize or otherwise make log appends concurrency-safe while preserving the existing storage key, schema, chronological order, and 1000-entry retention.

## 5. Verification

- [x] 5.1 Run focused tests for feature registry, Chapters/Ask auto-open, subtitle policy, playback speed, and feature logging.
- [x] 5.2 Run the repository quality gate with `npm run check`.
- [x] 5.3 Build the extension with `npm run build` for browser validation readiness.
