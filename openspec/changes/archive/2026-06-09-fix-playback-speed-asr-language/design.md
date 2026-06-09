## Context

`playback-speed` initializes each confirmed YouTube watch video from a language-derived default: English slows down, Spanish speeds up, and unknown or other languages stay at `1.00x`. The shared player bridge already exposes `audioLanguage` inferred from the active audio track and the full caption-track list.

The current feature falls back from `audioLanguage` to the first Spanish caption track, then the first English caption track. That is too broad because many videos expose translated caption tracks unrelated to the active audio. The observed TED-Ed video reports active audio as `und` / `Default`, exposes both Spanish and English caption tracks, and is incorrectly initialized as Spanish because Spanish is checked first.

## Goals / Non-Goals

**Goals:**

- Keep active audio-track metadata authoritative whenever it yields a known language.
- Allow unknown active audio to use only direct ASR caption metadata as a narrow language signal for English or Spanish.
- Prefer English when unknown active audio exposes both English ASR and Spanish ASR signals.
- Align playback-speed behavior and tests around English speed `0.95x`.
- Preserve per-video initialization, manual override, and stale-navigation protections.

**Non-Goals:**

- Detect every possible language from captions.
- Change subtitle policy behavior.
- Change the YouTube player bridge response shape.
- Persist playback-speed defaults across videos or tabs.

## Decisions

### Use a narrow ASR-only fallback for unknown audio

When `snapshot.audioLanguage` is missing or unusable, `playback-speed` should inspect caption tracks only for direct auto-generated tracks. A track qualifies when its language is English or Spanish and it has ASR-style metadata such as `kind: "asr"` or a `vssId` beginning with `a.`.

Alternative considered: keep using any English or Spanish caption track. Rejected because translated/manual captions are common and do not prove the spoken audio language.

Alternative considered: never use captions for playback-speed language inference. Rejected because some videos with unknown active audio still expose strong direct ASR metadata that identifies the speech language.

### Keep active audio language authoritative

If `snapshot.audioLanguage` reports English, Spanish, or another known language, the feature should use that result and should not let caption metadata override it. This prevents an English ASR track from changing explicitly non-English audio, or a Spanish ASR track from changing explicitly English audio.

Alternative considered: combine audio and ASR signals equally. Rejected because active audio metadata is closer to the selected playback stream.

### Prefer English when ASR fallback is ambiguous

If active audio is unknown and both English ASR and Spanish ASR tracks are present, the feature should classify the video as English and apply `0.95x`.

Alternative considered: keep `1.00x` on ambiguity. Rejected by product decision to prefer English for this edge case.

Alternative considered: prefer Spanish. Rejected because it would preserve the user-visible failure mode seen in the observed video class.

### Keep ASR detection local or shared only if already suitable

The implementation can use a small helper near playback-speed language selection or reuse an existing shared helper if it is already exported and fits the playback-speed semantics. The helper should avoid broader refactoring of subtitle policy or bridge code.

Alternative considered: move all audio-language fallback decisions into the bridge. Rejected because the bridge should continue reporting raw player state and the fallback policy is feature-specific.

## Risks / Trade-offs

- [YouTube metadata shapes may rename ASR fields] → Mitigation: accept both `kind: "asr"` and ASR-style `vssId` prefixes, matching existing project conventions.
- [Some videos may expose misleading ASR tracks] → Mitigation: use ASR fallback only when active audio is unknown; known active audio remains authoritative.
- [Ambiguous English+Spanish ASR may still choose incorrectly] → Mitigation: the product decision explicitly prefers English for this edge case.
- [Spec and existing implementation disagree on English speed] → Mitigation: update the playback-speed spec and tests to `0.95x` as the source of truth.
