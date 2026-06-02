## 1. Renderer State Detection

- [x] 1.1 Add a small helper to detect rendered caption text from YouTube caption segment DOM without treating absence as definitive failure.
- [x] 1.2 Add tests for caption text detection when segments are present, absent, or empty.

## 2. UI Refresh Fallback

- [x] 2.1 Add an isolated helper that refreshes captions through YouTube's captions UI control without using keyboard shortcuts.
- [x] 2.2 Ensure the helper is safe when the captions control is missing or not clickable.
- [x] 2.3 Add tests for successful fallback invocation and no-op behavior when the UI control is unavailable.

## 3. Policy Integration

- [x] 3.1 Extend English subtitle application verification to wait roughly two seconds for rendered caption text after logical selection succeeds.
- [x] 3.2 Trigger the UI refresh fallback at most once per video/application attempt when logical selection still matches and rendered caption text is absent.
- [x] 3.3 Re-check current video and subtitle selection before fallback so user overrides and SPA navigation prevent stale refreshes.
- [x] 3.4 Keep logical subtitle selection as the final success signal after the one-time fallback.

## 4. Verification

- [x] 4.1 Add unit tests covering renderer text present during grace period, absent text triggering one fallback, absent text not causing repeated fallback, user override during grace period, and navigation before fallback.
- [x] 4.2 Run the focused subtitle policy tests.
- [x] 4.3 Run the repository check command.
