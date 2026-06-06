## Context

The audio-language subtitle policy currently bases English-vs-non-English decisions on the active player audio language inferred from `getAudioTrack()`. Some YouTube videos report the active audio as `und` / `Default` even though the player exposes an English auto-generated caption track (`kind: "asr"`, `vssId: "a.en"`) generated from the active audio. In that state, the policy leaves captions off.

## Goals / Non-Goals

**Goals:**

- Activate direct English captions for videos whose active audio language is unknown but whose caption metadata strongly indicates English speech through an English auto-generated track.
- Keep explicit non-English audio authoritative and leave captions off for those videos.
- Avoid treating generic English caption availability as proof that the audio is English.

**Non-Goals:**

- Detect every possible audio language from captions.
- Add UI controls, notifications, settings, or user prompts.
- Change playback-speed language detection.
- Change YouTube player bridge APIs or storage behavior.

## Decisions

- Add the fallback at the subtitle policy decision layer, not in the player bridge. The bridge should continue reporting the player snapshot as observed; policy code can decide how to interpret incomplete metadata.
- Treat only English auto-generated caption tracks as an English-audio fallback. A track qualifies when its language is English and it has ASR-style metadata such as `kind: "asr"` or an ASR-style `vssId` like `a.en`.
- Do not apply the fallback when `audioLanguage` is explicitly non-English. Explicit player audio metadata is more reliable than caption metadata.
- Continue selecting the direct English caption track that triggered or supports the English-audio decision, reusing the existing `determineSubtitleSelection` flow.

## Risks / Trade-offs

- English ASR tracks could theoretically exist for non-English or mixed-language content → Mitigation: use the fallback only when active audio is unknown, never when it is explicitly non-English.
- YouTube may change ASR metadata shapes → Mitigation: support the two observed stable indicators (`kind: "asr"` and `vssId` prefix `a.`) with tests, while keeping the change localized.
- Some unknown-audio English videos without ASR metadata will still leave captions off → Mitigation: intentionally conservative to avoid enabling captions on non-English videos with manual English subtitles.
