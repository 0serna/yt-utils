## Context

The MAIN-world YouTube player bridge is the shared source for `PlayerSnapshot.audioLanguage`. Both subtitle policy and playback-speed consume that value and assume it represents the active audio language. Browser inspection of `AHIEISxt8Vk` showed YouTube returning an opaque top-level `audioTrack.id` token while the real language data was available under `audioTrack.US.id = "es-US.4"` and `audioTrack.US.name = "Spanish (US) original"`.

The current bridge checks known metadata shapes before the top-level `audioTrack.id`, but it does not recognize `US`. When none of the known shapes are found, the bridge normalizes the opaque top-level ID and accepts it because it is not `und`. That produces a truthy but semantically invalid `audioLanguage`, preventing feature-specific unknown-audio fallbacks from running.

## Goals / Non-Goals

**Goals:**

- Preserve `PlayerSnapshot.audioLanguage` as a reliable contract: normalized language code or `null`.
- Recognize the observed `US` audio-track metadata shape.
- Reject opaque YouTube audio-track IDs instead of treating them as languages.
- Keep audio-track name inference as a fallback for English and Spanish when IDs are unusable.
- Let downstream features continue to decide their own caption fallback behavior when audio language is unknown.

**Non-Goals:**

- Infer language from arbitrary caption tracks in the bridge.
- Replace explicit metadata-shape handling with generic scanning of every audio-track object property.
- Expand name-based language inference beyond English and Spanish.
- Change playback-speed values, subtitle selection policy, or UI behavior directly.

## Decisions

### Recognize `US` as an explicit metadata shape

Add `US` to the typed `AudioTrack` metadata shape and to the bridge's ordered metadata candidates for ID and name reads. Keep the existing explicit list style (`C_`, `Iw`, `Z1`, `yG`, `hs`) instead of scanning arbitrary keys.

Alternative considered: generic detection of any object with `{ id, name }`. Rejected because YouTube player objects contain many minified properties, and generic scanning can accidentally treat unrelated nested objects as audio metadata.

### Validate normalized IDs before accepting them

`isKnownLanguageCode` should reject `null`, `und`, and any normalized string that does not look like a simple BCP-style language code. The accepted shape should cover ordinary forms such as `en`, `es-us`, and `pt-br` while rejecting opaque tokens with semicolons, spaces, or long encoded payloads.

Alternative considered: continue accepting any non-`und` string while adding `US`. Rejected because the original failure mode can recur whenever YouTube moves language metadata to another unrecognized property.

Alternative considered: accept only English and Spanish. Rejected because shared subtitle policy needs to distinguish other known languages from unknown audio.

### Keep name inference after ID validation fails

If all candidate IDs are absent or invalid, the bridge should continue inferring `en` or `es` from audio-track names such as `English original` or `Spanish (US) original`. This remains more authoritative than caption metadata because it belongs to the active audio track.

Alternative considered: return `null` immediately after invalid IDs. Rejected because it would discard useful active-audio metadata and rely on weaker downstream fallbacks.

### Keep caption fallback out of the bridge

The bridge should expose player state and active-audio inference, not feature-specific caption policies. Playback-speed can use ASR fallback when `audioLanguage` is `null`; subtitle policy can apply its own English-ASR behavior.

Alternative considered: move ASR fallback into bridge `audioLanguage`. Rejected because ASR fallback semantics differ by feature and should not blur the raw active-audio contract.

## Risks / Trade-offs

- [YouTube may introduce more metadata shapes] → Mitigation: explicit shape tests make future additions small and safe.
- [BCP-style validation may reject a rare valid YouTube language code] → Mitigation: rejected IDs fall through to name inference or `null`, avoiding false positives and preserving downstream fallbacks.
- [Name inference only recognizes English and Spanish] → Mitigation: keep current behavior unchanged; unsupported names become unknown rather than incorrect.
- [Shared bridge change affects multiple features] → Mitigation: add bridge-level tests plus focused feature tests for playback-speed behavior with opaque IDs.
