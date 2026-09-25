# Design

## Context

Ver `proposal.md` para motivación. Estado actual: `readAudioTrackMetadata` en `src/shared/youtube-player-model.ts` solo lee `AUDIO_TRACK_METADATA_KEYS` (`C_`, `Iw`, `Z1`, `s1`, `US`, `yG`, `hs`). Observado en producción: `wM: { id: "es-US.4", name: "Spanish (US) original" }` con `id` top-level opaco `251;...`. `inferAudioLanguage` en `src/main-world/youtube-player-bridge.ts` devuelve `null` y `determineSubtitleSelection` activa ASR inglés.

## Goals / Non-Goals

**Goals:**

- Resolver `wM` de inmediato y tolerar la próxima llave sin cambiar política de subtítulos.
- Mantener `und` / opaco como desconocido y no confundir captions con audio.

**Non-Goals:**

- Cambiar qué idiomas activan subtítulos o velocidades.
- Usar `contentLanguage` heurístico como fuente para subtítulos.
- Tocar arquitectura bridge/polling.

## Decisions

### Agregar `wM` al frente de la precedencia conocida

Mantiene el patrón existente y corrige el caso observado con cambio mínimo. Precedencia propuesta: `wM`, `C_`, `Iw`, `Z1`, `s1`, `US`, `yG`, `hs`, con fallthrough por campo como hoy.

Alternativa: solo fallback genérico sin `wM`. Rechazada porque la llave conocida merece prioridad determinista y tests explícitos.

### Fallback genérico por forma (`id` o `name` utilizable)

Si la allowlist no produce `id` ni `name`, escanear valores propios del objeto audio-track buscando forma metadata (objeto no-array con `id` string no vacío o `name` string no vacío) y tomar el primero. Excluir `id`, `captionTracks`, `captionsInitialState`, `xtags`, `Z`, `A`, `B`, `K`, `S`, `W`.

Alternativa: regex de llaves de 2 chars. Rechazada por frágil; la forma es más estable que el nombre de la llave.

### No tocar `inferAudioLanguage` ni `determineSubtitleSelection`

El fix vive en `readAudioTrackMetadata`; el resto sigue igual. Así `es-us` vuelve a ser no-inglés -> `off`, y `und` sigue desconocido.

## Risks / Trade-offs

- [Futura llave no-audio con forma `{id, name}`] → Mitigación: exclusión explícita + chequeo `isDefault`/`isAutoDubbed` opcional en tests; precedencia conocida primero.
- [Caption con `id` string en el futuro] → Mitigación: `S`/`W` excluidos y la forma exige `id` o `name` string no vacío.
- [Doble metadata válida] → Mitigación: se toma la primera en orden de llaves tras la allowlist; documentado en tests.

## Migration Plan

Sin migración. Cambio backwards-compatible. Rollback: revertir commit.

## Open Questions

Ninguna que bloquee specs o tasks.
