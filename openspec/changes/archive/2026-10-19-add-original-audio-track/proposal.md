# Proposal

## Why

El video https://www.youtube.com/watch?v=bNQ1svSw8VY muestra `skip-overridden` desde las 14:11:29: la pista de audio cambió de `es-US` a `en-US` y la política de subtítulos trató ese cambio como un Subtitle Override, así que dejó los subtítulos apagados el resto de la Watch Session. El cambio de audio lo produjo la extensión externa "YouTube Original Audio Track". Mientras esa extensión exista, cada carga de vídeo puede romper la política.

Controlar la pista de audio dentro de esta extensión elimina la dependencia externa y deja una sola fuente de verdad: primero se elige el audio original, después se decide el subtítulo con esa base.

## What Changes

- Nueva feature `original-audio-track`: en cada Watch Session selecciona la Original Audio Track si la pista activa está doblada.
- Selección determinista: `isAutoDubbed: false`; si no hay tal pista, la primera con `isDefault: true`. Sin candidata, no toca nada.
- La selección se aplica una sola vez por Watch Session. Si después el usuario elige otra pista a mano, la feature no la revierte.
- Aplicación vía el bridge del player (`setAudioTrack`), no por clicks en el menú de ajustes.
- El snapshot del player expone las pistas de audio disponibles y su metadata, para que la feature y la política usen la misma lectura.
- `audio-language-subtitle-policy` deja de contar cambios de audio como Subtitle Override: el override se decide solo con el estado de subtítulos.
- `audio-language-subtitle-policy` recalcula la decisión cuando cambia la firma de audio, así sigue el audio que acaba de elegir `original-audio-track`.
- El timestamp de gracia se rearma en cada aplicación, no en la primera.

## Capabilities

### New Capabilities

- `original-audio-track`: selección de la pista de audio original en cada Watch Session, con lectura de pistas disponibles y aplicación tolerante a fallos.

### Modified Capabilities

- `audio-language-subtitle-policy`: el Subtitle Override ignora cambios de audio, y la política vuelve a decidir cuando cambia la pista de audio.

## Impact

- `src/main-world/youtube-player-bridge.ts`: nueva acción de bridge para aplicar una pista de audio y lectura de `getAvailableAudioTracks()` en el snapshot.
- `src/shared/youtube-player-model.ts`: pistas disponibles en `PlayerSnapshot`, selector de pista original, firmas de audio y subtítulo separadas.
- `src/shared/youtube-player.ts`: envoltorio de la acción de bridge.
- `src/features/original-audio-track/content.ts`: nueva feature registrada en `src/content.ts`.
- `src/features/audio-language-subtitle-policy/content.ts`: regla de override y de recálculo.
- Tests: `src/shared/youtube-player-model.test.ts`, `src/main-world/youtube-player-bridge.test.ts`, `src/features/original-audio-track/content.test.ts`, `src/features/audio-language-subtitle-policy/content.test.ts`.
