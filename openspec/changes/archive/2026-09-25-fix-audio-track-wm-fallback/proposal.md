# Proposal

## Why

Videos en español (`es-US` original) están activando subtítulos ingleses auto-generados. YouTube rotó la llave minificada de metadata de audio a `wM`, que `readAudioTrackMetadata` no reconoce, por lo que `audioLanguage` queda `null` y la heurística unknown + ASR inglés clasifica el video como inglés.

## What Changes

- Agregar `wM` a la precedencia conocida de metadata de audio en `src/shared/youtube-player-model.ts`.
- Agregar fallback genérico por forma `{id: string, name: string}` para tolerar futuros renames de llaves minificadas sin cambiar política de subtítulos.
- Excluir llaves no-audio (`captionTracks`, `S`, `W`, `id` top-level, flags) del fallback para no confundir pistas de captions con metadata de audio.
- Mantener `und` / ids opacos como desconocido y la heurística ASR solo para desconocido real.

## Capabilities

### New Capabilities

- `audio-language-subtitle-policy`: política de subtítulos usa el idioma activo del audio; ante rename de metadata debe seguir resolviendo español/inglés y solo tratar como desconocido cuando no hay metadata usable.

### Modified Capabilities

Ninguna (no hay spec existente para esta capability en `openspec/specs/`).

## Impact

- Afecta `src/shared/youtube-player-model.ts` (`AUDIO_TRACK_METADATA_KEYS`, `readAudioTrackMetadata`), snapshot `audioLanguage` consumido por `audio-language-subtitle-policy` y `playback-speed`.
- Sin cambios de UI, permisos, APIs ni storage.
- Riesgo: fallback demasiado amplio podría leer una llave futura no-audio; se mitiga con chequeo de forma y lista de exclusión.
