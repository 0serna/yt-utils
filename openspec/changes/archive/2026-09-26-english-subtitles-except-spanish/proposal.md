# Proposal

## Why

El video https://www.youtube.com/watch?v=N2uQWfV6Jr4 expone audio `und` con pista inglesa directa `.en` y la extension deja los subtitulos apagados. La regla actual solo enciende ingles automatico para audio desconocido, por eso ese caso queda fuera.

## What Changes

- Solo el audio español apaga los subtitulos.
- Audio ingles, otro idioma conocido, o idioma desconocido enciende subtitulos en ingles cuando hay pista inglesa disponible.
- Prioridad de pista inglesa: directa primero, luego autogenerada ASR.
- Sin pista inglesa disponible, el resultado es `off` como fallback.
- Ajustar el cache de `off` para no recordar un apagado prematuro cuando las pistas aun no cargaron, tambien fuera del caso ingles.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `audio-language-subtitle-policy`: cambia la decision de seleccion de subtitulos desde "solo ingles y ASR desconocido encienden" a "solo español apaga, resto enciende ingles".

## Impact

- `src/shared/youtube-player-model.ts`: funcion `determineSubtitleSelection`.
- `src/features/audio-language-subtitle-policy/content.ts`: guardia `shouldRememberMatchingSelection` para reintentos con pistas tardias.
- Tests en `src/shared/youtube-player-model.test.ts` para audio no español y audio desconocido con pista directa.
- Spec existente `audio-language-subtitle-policy`, escenarios de audio frances y desconocido con pista directa.
