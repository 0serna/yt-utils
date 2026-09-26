# Design

## Context

Ver `proposal.md` para el motivo. Estado actual en `src/shared/youtube-player-model.ts`: `determineSubtitleSelection` enciende ingles solo para audio ingles directo y para desconocido con ASR. Cualquier idioma conocido no ingles apaga. El cache de `off` en `src/features/audio-language-subtitle-policy/content.ts` solo evita el apagado prematuro para ingles sin pistas.

## Goals / Non-Goals

**Goals:**

- Un solo gate de apagado: audio español via `isSpanishLanguage`.
- Encendido en ingles con prioridad directa primero, luego ASR.
- No cachear `off` cuando la ausencia de pista puede deberse a carga tardia.

**Non-Goals:**

- Traduccion automatica al ingles con `translationLanguages`.
- Uso de `contentLanguage` como señal de español.
- Cambios en override de usuario, firma de estado, o fallback de renderer.

## Decisions

**Gate español primero, resto busca pista inglesa.**

Se evalua `isSpanishLanguage(audioLanguage)` y si es verdadero se devuelve `off` sin mirar pistas. En otro caso se busca pista inglesa directa y luego ASR. Alternativa de mantener una rama separada para ingles se descarta porque duplica la busqueda y el gate español ya la cubre.

**Prioridad directa luego ASR, fallback `off`.**

La pista directa `.en` con `kind` vacio cubre el video reportado. ASR queda como segunda opcion para desconocidos sin directa. Sin ninguna pista inglesa se devuelve `off` porque no hay que encender. Alternativa de aceptar cualquier pista traducible se descarta porque el bridge pasa el objeto track a `setOption` y no hay evidencia de que la traduccion funcione por esa via.

**Generalizar el guardia de `off` prematuro.**

Nuevo comportamiento: si lo deseado es `off` y no hay `audioLanguage`, no se recuerda. Si el audio es español, se recuerda. Si no es español, solo se recuerda cuando `captionTracks` no esta vacio. Esto extiende la proteccion actual del ingles a frances, `und` y otros, y evita que un snapshot temprano sin pistas bloquee el encendido posterior.

## Risks / Trade-offs

- [Video en español con audio `und`] → la regla usa solo `audioLanguage`, asi que encenderia ingles aunque el contenido sea español. Mitigacion: se deja fuera de alcance por ahora; si importa se plantea usar `contentLanguage` en otro cambio.
- [Cambio de comportamiento para audio no español con pista inglesa] → videos en frances u otros que antes quedaban apagados ahora encenderan ingles. Mitigacion: es el comportamiento pedido; el override de usuario sigue respetado.
- [Pistas que llegan tarde] → el reintento depende del polling cada 500 ms. Mitigacion: al no cachear el `off` prematuro, el siguiente ciclo reaplica.

## Migration Plan

Sin migracion. Cambio de comportamiento en la extension. Rollback con revert del change.
