## Context

The MAIN-world YouTube player bridge reads data from YouTube's `#movie_player`, infers audio language, reads caption state, and responds to content-script messages. Fallow currently reports multiple findings in this area, including `inferAudioLanguage`, `readPlayerSnapshot`, the message listener, `readVideoId`, `applySubtitleSelection`, and `readCurrentCaptionTrack`. The related player model also contains signature helpers with Fallow health findings.

The preceding test change is expected to provide black-box characterization coverage for this behavior before the refactor begins.

## Goals / Non-Goals

**Goals:**

- Reduce Fallow health findings in `youtube-player-bridge` and related model helpers through simpler code structure.
- Preserve bridge request/response message shape and behavior.
- Preserve default subtitle-off policy behavior used by content scripts.
- Keep changes small and behavior-preserving, guided by characterization tests.

**Non-Goals:**

- Changing the subtitle policy to select tracks or translations.
- Changing extension messaging protocols.
- Adding new user-facing behavior.
- Refactoring unrelated Fallow hotspots such as `syncAskPanel` or playback-speed code.
- Hiding remaining debt with suppressions or weaker thresholds.

## Decisions

- Refactor after characterization tests rather than before them. The bridge touches browser globals and YouTube's private player APIs, so preserving behavior matters more than achieving an immediate metric improvement.
- Prefer extracting small pure helpers when they reduce branch concentration and improve readability. Avoid adding abstractions that are not reused or that obscure the bridge's observable behavior.
- Keep bridge internals internal unless a production module needs them. Tests should protect behavior first; exports should be introduced only when they are part of a real module boundary.
- Normalize repeated fallback logic with small data-driven helpers where useful, especially for video ID, language ID, and audio-track name fallback paths.
- Treat Fallow findings as a guide, not the only goal. A refactor is complete when tests/build pass and findings are reduced without changing runtime behavior.

## Risks / Trade-offs

- Refactoring bridge module initialization can accidentally install duplicate or missing message listeners → Keep installation guard behavior intact and verify with black-box tests.
- YouTube private player fields such as `yG` and `hs` may be unstable → Preserve existing fallback order unless tests and current behavior justify a change.
- Reducing complexity can produce too many tiny helpers → Prefer the smallest extraction that makes branches easier to test and maintain.
- Fallow may still report findings after this focused refactor → Leave remaining debt visible for later changes rather than weakening the gate.

## Migration Plan

- Confirm characterization tests from `add-vitest-characterization-tests` are present and passing.
- Refactor `youtube-player-bridge` in small steps, running tests after each meaningful change.
- Refactor related model helper complexity only where covered and behavior-preserving.
- Run full validation commands and compare Fallow health findings before and after.

## Open Questions

- None.
