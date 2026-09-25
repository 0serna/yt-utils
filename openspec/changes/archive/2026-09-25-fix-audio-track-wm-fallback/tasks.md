# Tasks

## 1. Modelo de audio tolerante a renames

- [x] 1.1 Agregar `wM` a la precedencia de metadata y fallback por forma en `readAudioTrackMetadata`, y verificar con reproducción de `wM es-US.4` -> `es-us` y `und` -> desconocido
- [x] 1.2 Agregar cobertura `youtube-player-model.test.ts` para `wM` español, llave futura desconocida y exclusión de `S`/`W`/captions, y verificar con `npm test -- src/shared/youtube-player-model.test.ts`
- [x] 1.3 Agregar cobertura `youtube-player-bridge.test.ts` para snapshot con `wM es-US.4` y verificar `audioLanguage` `es-us`, con `npm test -- src/main-world/youtube-player-bridge.test.ts`

## 2. Validación

- [x] 2.1 Correr suite enfocada `npm test -- src/shared/youtube-player-model.test.ts src/main-world/youtube-player-bridge.test.ts src/features/audio-language-subtitle-policy/content.test.ts` y verificar que pasa
- [x] 2.2 Correr `npm run check` y `npm run build`, y verificar salida 0 antes de pedir recarga de la extensión
