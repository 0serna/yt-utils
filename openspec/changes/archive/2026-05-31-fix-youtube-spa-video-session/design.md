## Context

YouTube watch pages are single-page application surfaces: navigating from one video to another usually changes `window.location` and the active `movie_player` without reloading the document or reinjecting content scripts. Several watch-page features maintain per-video state and async work: Chapters/Ask auto-open waits for panels, subtitle policy applies and verifies player caption state, playback speed initializes from inferred audio language, and the feature registry logs lifecycle events.

Investigation of the failing tab showed the current URL and `movie_player` identified the new video, while YouTube bootstrap globals such as `ytInitialPlayerResponse` and `ytplayer.config` still referenced a previous video. The bridge read the current player correctly, and the current video's Chapters and Ask DOM were present, so the problem is best treated as SPA lifecycle/session coordination rather than DOM selector breakage.

## Goals / Non-Goals

**Goals:**

- Define a watch-video session boundary based on the URL `v` parameter.
- Ensure watch-page features reset per-video state when the watch video changes through SPA navigation.
- Invalidate pending async work from prior videos immediately on video change.
- Act only after the live player/bridge confirms the same video ID as the URL.
- Preserve current Chapters-first / Ask-fallback behavior and per-video subtitle semantics.
- Make lifecycle logs reliable for diagnosing concurrent SPA activation/deactivation events.

**Non-Goals:**

- Changing the subtitle language policy itself.
- Changing the summary prompt text or Ask fallback timing policy.
- Adding visible debugging UI or user-facing controls.
- Supporting non-watch YouTube surfaces beyond existing feature matching behavior.

## Decisions

### Use video ID as the watch-session identity

The registry and watch-page features should treat a supported watch page's `v` parameter as the session identity. A new session starts when the supported watch video ID changes; URL-only changes such as `t`, `pp`, or `feature` do not create a new video session.

Alternative considered: continue keying lifecycle by full `href`. This causes noisy resets for non-video URL changes and still does not explicitly model the per-video state that watch features need.

### Use URL as trigger and live player as confirmation

The URL video ID should trigger a new session and invalidate prior work. Feature actions that affect the player or engagement panels should wait until the bridge/live `movie_player` reports the same video ID before acting.

Alternative considered: act immediately when the URL changes. This is faster, but risks clicking panels or applying subtitles while YouTube is still showing stale player or panel state from the previous video.

### Cancel logically through session tokens

Async waits from previous videos should be invalidated by a changed session token. They do not need low-level abort controllers as long as every completion path checks the current token/video before mutating state, marking completion, clicking controls, or applying player settings.

Alternative considered: wait for old async work to finish naturally. This can leave the new video blocked by prior 1.8s–5s waits and matches the observed failure pattern.

### Keep features independently per-video but share session semantics

Feature-specific state remains owned by each feature, but all watch-page features should use the same session concept: current supported watch video ID plus confirmed player video ID before action. Shared helpers may be introduced only where they reduce duplication without changing feature behavior.

Alternative considered: centralize all feature sync into the registry. That would be a larger architectural change and is unnecessary for the current bug.

### Make log appends concurrency-safe

Lifecycle log writes should preserve concurrent entries from multiple feature activations/deactivations. The storage key and schema remain unchanged, but append behavior must avoid lost updates during bursts.

Alternative considered: treat logs as best-effort. That leaves the SPA lifecycle failure hard to diagnose and conflicts with the need for reliable activation/deactivation evidence.

## Risks / Trade-offs

- SPA timing remains nondeterministic → Gate actions on confirmed player video ID and current token checks.
- Some non-video URL changes may no longer trigger deactivate/activate → Keep page-surface changes distinct from same-video URL noise and retain polling/navigation listeners.
- More explicit session checks may delay actions slightly → Prefer correctness over acting on stale DOM/player state.
- Concurrent log reliability may add storage write serialization complexity → Keep the queue local and bounded, preserving the existing `yt-utils:logs` schema and retention limit.
- Existing tests may encode full-URL lifecycle assumptions → Update tests to reflect video-session semantics while preserving non-watch navigation behavior.
