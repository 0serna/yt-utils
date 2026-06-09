## 1. Playback-Speed Language Selection

- [x] 1.1 Replace broad caption-language fallback in `src/features/playback-speed/content.ts` with active-audio-first language selection.
- [x] 1.2 Add ASR-only fallback detection for direct English and Spanish auto-generated caption tracks when active audio language is unknown.
- [x] 1.3 Ensure ambiguous English+Spanish ASR fallback prefers English and known active audio language remains authoritative over caption metadata.

## 2. Test Coverage

- [x] 2.1 Update English playback-speed expectations to `0.95x` where needed.
- [x] 2.2 Add coverage that unknown audio plus non-ASR Spanish captions stays at `1.00x`.
- [x] 2.3 Add coverage that unknown audio plus English ASR applies `0.95x`.
- [x] 2.4 Add coverage that unknown audio plus Spanish ASR applies `1.10x`.
- [x] 2.5 Add coverage that unknown audio plus both English and Spanish ASR prefers `0.95x`.
- [x] 2.6 Add coverage that explicit non-English active audio is not overridden by English or Spanish ASR caption tracks.

## 3. Validation

- [x] 3.1 Run focused playback-speed tests.
- [x] 3.2 Run `npm run check`.
- [x] 3.3 Build the extension with `npm run build` if runtime validation is needed.
