# Design

## Context

- Ambas features viven en el mismo bundle de content script, así que un módulo `@shared/*` es una sola instancia para las dos.
- Hoy no se hablan: cada una tiene su propio `setInterval` de 500 ms y decide con lo que lee.
- `FeatureRegistry.register()` llama a `forceSync()` en cada registro (`src/shared/feature-registry.ts`). En una carga de la página eso da una ronda de deactivate/activate por feature registrada.
- Ver `proposal.md` para la motivación y los números del log.

## Goals / Non-Goals

**Goals:**
- Quitar el parpadeo de subtítulos cuando el audio cambia al arrancar un vídeo.
- Dejar el registro con un solo arranque, sin cambiar el modelo de activación por Watch Session.

**Non-Goals:**
- Unificar los dos sondeos en un solo bucle.
- Añadir mensajería entre features o al background.
- Cambiar cuándo se activa una feature ante un cambio de vídeo.

## Decisions

### Bandera compartida en memoria, no mensajes

Nuevo `src/shared/audio-switch.ts` con `markAudioSwitchPending()`, `clearAudioSwitchPending()` e `isAudioSwitchPending()`.
- Motivo: la única información que falta es "hay un cambio en vuelo". Un módulo compartido evita mensajería, orden de eventos y suscripciones.
- Alternativa descartada: `chrome.runtime.sendMessage` (viaja al background y vuelve; más caro y con más fallos posibles).
- Alternativa descartada: que la política lea `availableAudioTracks` y compare con la pista activa (no distingue "cambio en vuelo" de "audio estable raro").

### La marca dura hasta la confirmación, no hasta la promesa

`original-audio-track` marca antes de llamar al player y limpia cuando un snapshot confirma la pista original, cuando agota intentos o cuando se desactiva.
- Motivo: el player puede responder antes de reflejar la pista nueva. Limpiar al resolver la promesa deja una ventana donde la política todavía lee el audio viejo.
- Coste: si el player rechaza el cambio, la política no decide subtítulos durante el tope de intentos (5 ciclos, 2,5 s). Aceptable: el audio tampoco está estable.
- Alternativa descartada: limpiar la marca al resolver la promesa (deja la ventana abierta).

### La política salta el ciclo, no aplica y revierte

`syncPolicy` comprueba la marca después de leer el snapshot y, si está puesta, sale sin tocar el player.
- Motivo: saltar deja el estado anterior intacto. Aplicar y revertir produce exactamente el parpadeo que se quiere quitar.
- Alternativa descartada: aplicar igualmente y confiar en el recálculo (es el comportamiento actual).

### `start()` explícito en el registro

`register()` solo acumula; `start()` hace el único `forceSync()`. Una feature registrada después de `start()` sincroniza en ese momento.
- Motivo: el nombre dice lo que hace y el arranque queda en un punto visible de `src/content.ts`.
- Alternativa descartada: `queueMicrotask` dentro de `register()` (no cambia la API, pero esconde el momento del arranque y rompe las pruebas que hoy afirman activación inmediata).

## Risks / Trade-offs

- [Marca pegada por un error inesperado] → se limpia en `deactivate()`, en la confirmación y al agotar intentos.
- [Cambio de audio de un vídeo bloquea la política de otro] → la feature se desactiva al cambiar de vídeo, y eso limpia la marca.
- [Dos features leen la marca en momentos distintos] → el peor caso es un ciclo de más o de menos (500 ms), no un estado final incorrecto.
- [Cambio de API del registro] → solo `src/content.ts` y las pruebas de `feature-registry` llaman a `register`.

## Migration Plan

1. Implementar y verificar con tests.
2. Recargar la extensión y una página de watch: el historial debe tener una activación por feature y ninguna ronda intermedia.
3. Repetir el escenario de audio doblado: sin `SUB apply ds=off` intermedio.

## Open Questions

Ninguna.
