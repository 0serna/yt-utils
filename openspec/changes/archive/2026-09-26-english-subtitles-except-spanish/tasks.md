# Tasks

## 1. Selección en modelo

- [x] 1.1 Cambiar `determineSubtitleSelection` a gate español primero con búsqueda directa luego ASR y verificar con `npm test -- src/shared/youtube-player-model.test.ts`
- [x] 1.2 Actualizar casos de `youtube-player-model.test.ts` para francés con directa, desconocido con directa, y sin pista inglesa, y verificar que el archivo pasa

## 2. Cache de apagado

- [x] 2.1 Generalizar `shouldRememberMatchingSelection` para no cachear `off` prematuro fuera del inglés y verificar con `npm test -- src/features/audio-language-subtitle-policy/content.test.ts`
- [x] 2.2 Reproducir el caso `N2uQWfV6Jr4` con snapshot `und` y pista `.en` directa y verificar que la selección resulta en track

## 3. Validación

- [x] 3.1 Ejecutar `npm test` y verificar que todo pasa
- [x] 3.2 Ejecutar `npm run typecheck` y `npm run check` y verificar que ambos pasan
- [x] 3.3 Ejecutar `npm run build` y verificar que sale con código 0
