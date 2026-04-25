## Context

The extension currently applies YouTube watch-page behavior through feature modules that activate on SPA navigation. This change adds another watch-page feature, but unlike the existing DOM-focused automation it must interact with the live YouTube player object to read the active audio language and set subtitle tracks.

Exploration in Chrome showed that global bootstrap objects such as `window.ytInitialPlayerResponse` can become stale after navigation, while `#movie_player.getPlayerResponse()` and related methods reflect the current video reliably. The same exploration also showed that subtitle selection can be driven through player methods such as `toggleSubtitlesOn()`, `setOption('captions', 'track', ...)`, `setOption('captions', 'reload', true)`, `isSubtitlesOn()`, `getAudioTrack()`, and `getAvailableAudioTracks()`.

The feature must stay silent, must not add user-facing UI, and must stop intervening for a video once the user changes subtitle or audio behavior manually.

## Goals / Non-Goals

**Goals:**

- Apply a deterministic subtitle policy when a YouTube watch page becomes active.
- Detect the active audio language from the live player state rather than from document language or stale bootstrap data.
- Prefer direct English subtitles for non-Spanish audio, then fall back to auto-translated English, then turn subtitles off.
- Respect per-video manual user overrides after the initial policy application.
- Keep the implementation resilient to YouTube SPA navigation and feature reactivation.

**Non-Goals:**

- Adding user-facing settings, toggles, badges, or notifications for subtitle policy.
- Persisting per-channel or global subtitle preferences beyond the current policy rules.
- Reworking unrelated feature-registry or background-script architecture.
- Supporting non-watch YouTube pages.

## Decisions

### Use the live player in the page's main world

The feature will read and control subtitles through the current `#movie_player` instance in the page's main JavaScript world. This avoids stale data issues found in `window.ytInitialPlayerResponse` and allows direct use of YouTube's player methods.

Alternative considered: use document language, visible labels, or bootstrap globals. Rejected because these signals can reflect UI language or previous videos instead of the active watch-page player state.

### Split responsibilities between content feature orchestration and player-state helpers

The watch-page feature should remain responsible for activation, per-video bookkeeping, and deciding when to re-run. The player inspection and mutation logic should live in focused helpers so the feature code can reason in terms of policy outcomes rather than raw player internals.

Alternative considered: keep all logic inline inside the feature module. Rejected because the player interaction path includes multiple fallback branches and state verification steps that would make the feature harder to reason about and test.

### Detect audio language with ordered fallbacks

Audio language detection should use the active audio track first via `getAudioTrack()`. If the active track is missing or reports an undefined language such as `und`, the feature should fall back to the primary caption-track metadata from the live player response.

Alternative considered: infer language from video title or channel language. Rejected because it does not represent the selected audio track and breaks for dubbed or multilingual content.

### Apply subtitles through a verified sequence

The feature should treat subtitle changes as a sequence instead of a single command:

1. Read current player state.
2. Select the desired policy outcome.
3. If enabling subtitles, call `toggleSubtitlesOn()` first.
4. Select the target caption track with `setOption('captions', 'track', ...)`.
5. Call `setOption('captions', 'reload', true)`.
6. Re-read the current track to verify that the requested outcome actually took effect.

Exploration showed that `setOption('captions', 'track', ...)` does not enable subtitles by itself, so the explicit enable step is required.

Alternative considered: drive the Settings and Subtitles menus via clicks. Rejected because DOM labels were shown to be misleading and UI automation is more brittle than direct player API use.

### Prefer direct English before auto-translated English

For non-Spanish audio, the feature should look for a direct English track in the live caption tracks first. Only when no direct English track exists should it build a translated-track selection by combining a source track with the English entry from `getOption('captions', 'translationLanguages')`.

Alternative considered: always prefer translation for consistency. Rejected because direct English subtitles are more precise and avoid unnecessary translation artifacts.

### Respect manual overrides per video through state divergence tracking

The feature should record what policy state it applied for the current video and observe player state afterward. If the current subtitle or audio state diverges from the last state applied by the extension, the feature should treat that as a manual override and stop enforcing policy again for that video.

Alternative considered: reapply policy on every activation or mutation. Rejected because it would fight the user and violate the requirement to respect manual changes.

## Risks / Trade-offs

- [YouTube player internals change] -> Keep player access centralized, verify outcomes after every mutation, and fail closed by leaving subtitles off instead of looping through retries.
- [Audio language reports as undefined for some videos] -> Fall back to caption-track metadata and only act when the inferred language is confident enough for the policy.
- [Direct English selection fails even though English exists] -> Re-read the active caption track after mutation and fall back to auto-English or subtitles off instead of assuming success.
- [Override detection mistakes extension-applied state for manual state] -> Store the last extension-applied target per video and only mark manual override after a later observed divergence.
- [MAIN-world execution increases coupling to page internals] -> Keep the injected surface area small and limited to reading and setting player state.

## Migration Plan

This feature can be introduced as a self-contained watch-page module. No stored data migrations or external rollouts are required. If the feature causes regressions, rollback is limited to removing the new feature from the content-script registry and deleting its helpers.

## Open Questions

- Whether any edge-case videos expose multiple non-Spanish source caption tracks that require choosing a preferred source before auto-translating to English.
- Whether the implementation should watch only subtitle-state divergence or also audio-track changes when determining that the user manually overrode the policy.
