## Context

The current subtitle policy decides the desired selection from the active YouTube player snapshot. For English audio with a direct English subtitle track, it applies the track through the MAIN-world player bridge and verifies success with logical player state: `subtitlesOn=true` and matching `currentCaptionTrack`.

Browser exploration showed a YouTube state where the logical state is correct but the visual captions renderer remains empty. A real captions UI toggle wakes the renderer and visible caption segments appear. The feature currently records the logical state as applied, so it stops retrying even when the user sees no captions.

## Goals / Non-Goals

**Goals:**

- Preserve the existing audio-language policy and per-video override behavior.
- Detect the narrow state where English captions are logically active but the renderer appears dormant.
- Attempt a one-time UI-based captions refresh after a short grace period.
- Avoid requiring visible caption text as a permanent success condition, because intros and silent spans can legitimately have no caption segments.

**Non-Goals:**

- Do not change which languages enable or disable subtitles.
- Do not add new extension UI.
- Do not continuously monitor caption text throughout playback.
- Do not use keyboard shortcuts as the primary fallback mechanism.

## Decisions

### Use a one-time UI fallback instead of stronger logical retries

When the desired English track is logically selected but no `.ytp-caption-segment` text appears after roughly two seconds, the feature will attempt one captions UI refresh for that video/application attempt.

Alternatives considered:

- Reapply `setOption("captions", "track")` and `reload`: this is already close to current behavior and does not reliably wake the renderer.
- Use the `c` keyboard shortcut: exploration showed it works, but it depends on focus and can interfere with user input.
- Require visible text before success: too strict for silent intros and caption gaps.

### Preserve logical matching as the main policy success signal

The policy will continue to rely on player snapshot matching to decide whether the correct selection is active. Render probing is only used to decide whether to perform the one-time wake-up fallback.

Rationale: the absence of rendered text is ambiguous; the video may simply not have an active cue at that moment.

### Respect user override during the verification window

Before performing the UI fallback, the feature will re-check that the current video and logical subtitle selection still match the expected auto-applied state. If the user changed subtitle or audio state, the feature will treat that as an override and skip the fallback.

Rationale: this preserves the existing principle that the extension should not fight manual user choices.

### Keep fallback scoped to the current confirmed video

Fallback attempts and applied state remain per video and are invalidated by SPA navigation, matching the existing session-token and confirmed-video safeguards.

Rationale: delayed work from one video must not affect a later video.

## Risks / Trade-offs

- YouTube captions button selectors may change → Keep the fallback isolated behind a small helper so selector changes are local.
- A silent intro may trigger an unnecessary off/on UI refresh → Limit fallback to one attempt and do not require text afterward.
- UI refresh may produce a brief visual flicker → Use it only after logical selection is correct but render text is absent after the grace period.
- The captions button can expose misleading accessibility labels → Prefer actual control presence/clickability over trusting the label text.
