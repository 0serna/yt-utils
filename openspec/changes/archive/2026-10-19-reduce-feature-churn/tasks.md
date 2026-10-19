# Tasks

## 1. Bandera de cambio de audio

- [x] 1.1 Crear `src/shared/audio-switch.ts` con marcar, limpiar y consultar; verificar con `src/shared/audio-switch.test.ts` que el estado cambia y que el módulo arranca limpio (`npm run test -- audio-switch`).
- [x] 1.2 Exportar el módulo desde `@shared/audio-switch` y confirmar que no necesita `chrome.*` ni DOM (`npm run typecheck`).

## 2. original-audio-track anuncia el cambio

- [x] 2.1 Marcar el cambio antes de `applyAudioTrackSelection` y limpiar la marca al confirmar la pista original; verificar con un test de la feature que la marca queda puesta entre el pedido y la confirmación (`npm run test -- original-audio-track`).
- [x] 2.2 Limpiar la marca al agotar intentos y en `deactivate()`; verificar con tests de tope de intentos y de desactivación a mitad de cambio.

## 3. La política espera al audio

- [x] 3.1 Salir de `syncPolicy` sin tocar el player cuando la marca está puesta; verificar con un test que `applySubtitleSelection` no se llama mientras está puesta (`npm run test -- audio-language-subtitle-policy`).
- [x] 3.2 Reanudar la decisión al limpiar la marca; verificar con un test que tras `clearAudioSwitchPending()` la política vuelve a aplicar.

## 4. Arranque único del registro

- [x] 4.1 Quitar `forceSync()` de `register()` y añadir `start()`; mantener el sync inmediato para features registradas después de `start()`; verificar con tests de activación única y de registro tardío (`npm run test -- feature-registry`).
- [x] 4.2 Llamar a `registry.start()` al final de `src/content.ts`; verificar que la carga activa cada feature una sola vez con un test que registre varias features y cuente activaciones.

## 5. Verificación

- [x] 5.1 Correr `npm run check`, `npm run typecheck` y `npm test`; los tres en 0.
- [x] 5.2 Correr `npm run build` y pedir recarga manual.
- [x] 5.3 En una carga de watch, contar entradas de `yt-utils:logs`: una activación por feature y ninguna desactivación inicial.
- [x] 5.4 Repetir el escenario de audio doblado y confirmar que no aparece un `apply ds=off` intermedio antes del cambio a `en-US`.

## Workflow follow-up

- Ejecutar `$openspec-archive-change` cuando 5.1 a 5.4 estén verificadas.
