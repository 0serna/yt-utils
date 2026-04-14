## Context

The current watch-page playback-speed feature initializes at `1.00x`, then loads a globally persisted preference from extension storage and applies that value to future videos. The current subtitle policy already derives `audioLanguage` from live YouTube player state and uses it to decide whether English subtitles should be enabled, but its policy treats all non-Spanish audio as subtitle-eligible.

This change tightens both behaviors around the same product rule set:
- playback speed is decided per video, not globally
- English audio should start at `0.90x`
- Spanish and English audio should both leave subtitles off
- unknown language should fall back conservatively to `1.00x` and subtitles off

The relevant code is split across `src/features/playback-speed/content.ts`, `src/features/audio-language-subtitle-policy/content.ts`, `src/shared/youtube-player.ts`, and `src/main-world/youtube-player-bridge.ts`.

## Goals / Non-Goals

**Goals:**
- Remove global playback-speed persistence from watch-page behavior.
- Reuse the existing live-player language inference path for playback-speed initialization.
- Preserve manual playback-speed changes only for the current video session.
- Restrict automatic subtitle enablement to videos whose audio is neither English nor Spanish.
- Keep fallback behavior conservative when language cannot be inferred.

**Non-Goals:**
- Introducing a settings UI or user-configurable language rules.
- Reworking the inline playback-speed control layout or interaction model.
- Building a new language-detection system beyond the existing live-player heuristics.
- Synchronizing playback-speed changes across tabs or future navigations.

## Decisions

### Use the live player snapshot as the shared language source
Playback speed and subtitle policy will both rely on the language already exposed through `readPlayerSnapshot()` and `audioLanguage`.

Why:
- It reuses the same live YouTube player data path already used by subtitle policy.
- It avoids creating a second inference path inside playback speed.
- It keeps language-dependent behavior tied to the current video instead of document-level state.

Alternative considered:
- Duplicate language detection inside `playback-speed` using DOM or player probing. Rejected because it would drift from subtitle behavior and create another place to maintain language heuristics.

### Playback speed will initialize per video with a conservative baseline
Each supported watch page will begin at `1.00x`. After the current video's audio language is read, the feature will change the speed to `0.90x` only when the language resolves to English. For all other resolved languages, or when the language remains unknown, the speed stays at `1.00x`.

Why:
- It matches the requested product behavior.
- It ensures a stable baseline while the player snapshot resolves asynchronously.
- It avoids surprising carry-over from past videos.

Alternative considered:
- Persist the user's last selected speed in session or extension storage. Rejected because the new requirement is explicitly per-video and non-global.

### Manual speed changes remain local to the current video
Once the user changes speed with the inline control, the feature will stop applying its initial language-based default for that video. Navigating to another video resets this state and re-evaluates the language-based default again.

Why:
- It preserves user intent within the current video.
- It mirrors the subtitle feature's existing per-video override philosophy.

Alternative considered:
- Keep the user-selected speed for the whole tab session. Rejected because it would recreate hidden persistence across videos.

### Subtitle auto-selection will target only non-English, non-Spanish audio
Subtitle policy will treat both English and Spanish audio as subtitle-off languages. Only audio that is neither English nor Spanish will attempt a direct English track first, then English auto-translation if available.

Why:
- It directly matches the requested behavior.
- It narrows the policy to the cases where English subtitles provide translation value.

Alternative considered:
- Keep English audio eligible for English subtitles. Rejected because it over-applies subtitles to content the user already understands.

### Unknown language remains a no-op state
If the system cannot infer the audio language after the existing live-player heuristics run, it will not enable subtitles and it will not lower playback speed.

Why:
- It minimizes false positives.
- It prevents aggressive behavior when metadata is incomplete or ambiguous.

Alternative considered:
- Infer more aggressively from whichever caption metadata appears first. Rejected for this change because the goal is predictable behavior, not broader inference coverage.

## Risks / Trade-offs

- [Caption metadata can misrepresent spoken audio] -> Keep unknown-language fallback conservative and continue to prefer active audio-track metadata before caption metadata.
- [Asynchronous language reads can race with initial video setup] -> Apply `1.00x` immediately, then apply the English-specific adjustment only if the user has not already changed speed.
- [Language inference logic exists in both shared and bridge layers] -> Update both copies within the same change so playback speed and subtitle policy stay aligned.
- [Old persisted speed values may remain in extension storage] -> Stop reading and writing the key; leaving stale data unused is acceptable because behavior no longer depends on it.

## Migration Plan

No data migration is required. Existing persisted playback-speed values can remain in storage unused because the feature will stop reading them. Deployment is behavior-only:

1. Ship the updated per-video initialization and subtitle policy together.
2. Verify new watch pages start at `1.00x`, then move to `0.90x` for English audio only.
3. Verify subtitle policy now leaves English and Spanish audio unsubtitled by default.

Rollback is straightforward: restore the previous playback-speed persistence path and prior subtitle-selection rules.

## Open Questions

- None for the initial implementation scope.
