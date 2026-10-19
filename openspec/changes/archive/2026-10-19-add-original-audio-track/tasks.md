# Tasks

## 1. Modelo de audio en el snapshot

- [x] 1.1 Agregar `availableAudioTracks` a `PlayerSnapshot` con `{ id, name, isDefault, isAutoDubbed, languageCode }` y su resumen en `summarizePlayerSnapshot`; verificar con `npm run test -- youtube-player-model`.
- [x] 1.2 Agregar el selector de pista original (`isAutoDubbed: false`, fallback `isDefault: true`) en `src/shared/youtube-player-model.ts`; verificar con casos en `youtube-player-model.test.ts` (`npm run test -- youtube-player-model`).
- [x] 1.3 Leer `getAvailableAudioTracks()` en `src/main-world/youtube-player-bridge.ts` y devolver la lista en el snapshot; verificar con `npm run test -- youtube-player-bridge`.

## 2. Aplicación de audio por bridge

- [x] 2.1 Agregar la acción `applyAudioTrack` al tipo `BridgeRequest` y al bridge: buscar la pista por id en la lista viva y llamar a `setAudioTrack(track)`; verificar con `npm run test -- youtube-player-bridge`.
- [x] 2.2 Exponer `applyAudioTrackSelection(trackId)` en `src/shared/youtube-player.ts` sobre el helper `sendBridgeRequest`; verificar con `npm run test -- youtube-player`.
- [x] 2.3 Cubrir los casos de player sin `getAvailableAudioTracks`/`setAudioTrack` y de id inexistente en `youtube-player-bridge.test.ts`; verificar que devuelven `false` y no lanzan (`npm run test -- youtube-player-bridge`).

## 3. Feature original-audio-track

- [x] 3.1 Crear `src/features/original-audio-track/content.ts` con poll de 500 ms, Watch Session y una única aplicación por sesión; verificar con `src/features/original-audio-track/content.test.ts` (`npm run test -- original-audio-track`).
- [x] 3.2 Añadir tope de reintentos cuando `setAudioTrack` no cambia la pista y diagnóstico único por sesión; verificar con test de reintentos y de corte del tope.
- [x] 3.3 Registrar la feature en `src/content.ts` y verificar que el build la incluye (`npm run build`).

## 4. Corrección de la política de subtítulos

- [x] 4.1 Quitar la pista de audio de `readSubtitleSignature` (solo `on/off` + pista) y comparar la selección deseada en el atajo "ya aplicado"; verificar con `npm run test -- youtube-player-model`.
- [x] 4.2 Usar la firma de subtítulos en `isPolicyOverridden` y guardarla como `appliedSignature`; verificar con un caso de audio español → inglés en `content.test.ts` que no marque override (`npm run test -- audio-language-subtitle-policy`).
- [x] 4.3 Recalcular la selección cuando cambia solo la firma de audio; verificar con tests de `es-US → en-US` y `en-US → es-US`.
- [x] 4.4 Actualizar `appliedAtByVideo` en cada aplicación (`Date.now()` sin `??`) y verificar con un test de apply tardío que no marca override.

## 5. Verificación de integración

- [x] 5.1 Correr `npm run check`, `npm run typecheck` y `npm test`; los tres deben salir en 0.
- [x] 5.2 Correr `npm run build` y pedir recarga manual de la extensión.
- [x] 5.3 En `https://www.youtube.com/watch?v=bNQ1svSw8VY`, confirmar en `yt-utils:logs` que no hay `skip-overridden` por audio y que el audio queda en `en-US original` con subtítulos `en` encendidos.
- [x] 5.4 Desinstalar "YouTube Original Audio Track" y repetir 5.3 en una carga nueva.

## Workflow follow-up

- Ejecutar `$openspec-archive-change` cuando 5.1 a 5.4 estén verificadas.
