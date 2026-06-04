## Context

The subtitle policy and playback-speed feature both depend on the live YouTube player snapshot exposed by the MAIN-world bridge. Recent browser exploration showed that `#movie_player.getAudioTrack()` can report the active audio metadata under a minified `C_` property, for example `{ C_: { id: "en-US.4", name: "English (US) original" } }`, while the bridge currently recognizes older `hs` and `yG` metadata shapes. When the active audio metadata is missed, the current fallback to caption-track order can make English detection timing-dependent and can activate or skip subtitles inconsistently across new tabs and SPA navigations.

## Goals / Non-Goals

**Goals:**

- Read active audio language from all currently supported YouTube audio-track metadata shapes used by the live player.
- Keep subtitle policy decisions tied to active audio-track metadata rather than caption-track order.
- Keep playback-speed language initialization aligned with subtitle policy by using the same corrected player snapshot.
- Preserve existing per-video override, confirmed-video, and stale-navigation safeguards.

**Non-Goals:**

- Add new subtitle settings or visible UI.
- Change which languages enable subtitles or which speeds are selected for English, Spanish, other, or unknown audio.
- Add auto-translation fallback or broaden subtitle policy beyond direct English captions for English audio.
- Replace the bridge/message architecture or polling lifecycle.

## Decisions

### Recognize current audio metadata shapes in the bridge

The bridge will treat the active audio-track metadata object as the source of language identity and include the observed `C_` shape alongside existing `hs` and `yG` shapes. Language inference should prefer explicit language IDs from active audio metadata and then infer from active audio metadata names when needed.

Alternative considered: wait for YouTube to expose `hs` or `yG` later in the load cycle. Rejected because reproduction showed `C_` can be the available current shape, and waiting would keep behavior intermittent.

### Stop using caption-track order as an audio-language fallback

Caption tracks identify available text tracks, not necessarily the active audio language. The subtitle policy spec already requires that caption metadata alone must not activate subtitles, so the corrected inference should not treat `captionTracks[0].languageCode` as proof of English audio.

Alternative considered: keep caption-track fallback but delay policy application longer. Rejected because it still couples audio-language decisions to unrelated caption loading order and could incorrectly classify translated or multi-language caption sets.

### Keep language inference centralized in player snapshot construction

The MAIN-world snapshot should remain the single source for `audioLanguage` consumed by subtitle policy and playback speed. Feature modules should not duplicate DOM or menu probing for language detection.

Alternative considered: add feature-specific detection in subtitle policy only. Rejected because playback speed also depends on `audioLanguage`, and divergent inference would create inconsistent per-video behavior.

## Risks / Trade-offs

- [YouTube renames minified fields again] → Keep the metadata reader centralized and covered by bridge/model tests so future field additions are small and localized.
- [Some videos only expose `und` with no usable active metadata] → Treat language as unknown and preserve conservative behavior: subtitles off and default playback speed.
- [Removing caption-track fallback changes behavior for videos where active audio metadata is absent but captions are English] → This aligns with the current spec requirement to avoid activating subtitles from caption metadata alone.
