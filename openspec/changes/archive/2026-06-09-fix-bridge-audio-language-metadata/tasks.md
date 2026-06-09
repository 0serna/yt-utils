## 1. Bridge Audio Metadata Inference

- [x] 1.1 Add `US` to the shared `AudioTrack` metadata type.
- [x] 1.2 Include `US` in the bridge's explicit audio-track metadata ID and name candidate order.
- [x] 1.3 Replace broad non-`und` ID acceptance with simple BCP-style language-code validation.
- [x] 1.4 Preserve audio-track name fallback for English and Spanish when IDs are unusable.
- [x] 1.5 Ensure opaque or non-language top-level audio IDs produce `null` when no usable metadata ID or name exists.

## 2. Test Coverage

- [x] 2.1 Add bridge coverage for Spanish language inference from `audioTrack.US.id` when top-level `audioTrack.id` is opaque.
- [x] 2.2 Add bridge coverage that opaque-only audio-track IDs do not become `audioLanguage`.
- [x] 2.3 Add bridge coverage that opaque IDs can still infer Spanish or English from active audio-track name metadata.
- [x] 2.4 Add playback-speed coverage that an opaque audio ID with Spanish `US` metadata applies `1.10x`.
- [x] 2.5 Add playback-speed coverage that an opaque audio ID with no usable metadata allows Spanish ASR fallback to apply `1.10x`.

## 3. Validation

- [x] 3.1 Run focused bridge and playback-speed tests.
- [x] 3.2 Run `npm run check`.
- [x] 3.3 Run `npm run build` for extension validation.
