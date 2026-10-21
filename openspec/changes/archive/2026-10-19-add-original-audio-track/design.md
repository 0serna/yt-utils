# Design

## Context

- El bridge del MAIN world (`src/main-world/youtube-player-bridge.ts`) ya intercambia mensajes con el content script y expone `readSnapshot` y `applySelection`.
- `PlayerSnapshot` hoy incluye solo la pista de audio activa. No incluye la lista de pistas disponibles.
- `audio-language-subtitle-policy` sondea cada 500 ms dentro de una Watch Session y guarda `appliedSignature` por vídeo.
- `readSubtitleSignature` mezcla estado de subtítulos y pista de audio en una sola firma, y esa firma decide el override.
- Lectura en vivo del player del vídeo de prueba: 21 pistas de audio, `setAudioTrack(<objeto de getAvailableAudioTracks()>)` cambia la pista y `getAudioTrack()` la refleja en menos de 800 ms. Pasar solo el id no está verificado.
- La extensión externa que se quiere retirar hace clicks en el menú de ajustes y se ejecuta una sola vez por carga.

## Goals / Non-Goals

**Goals:**
- Una sola lectura del player alimenta ambas features: lista de pistas, pista activa y estado de subtítulos.
- El audio original se elige por metadata (`isAutoDubbed`), sin textos ni menús traducidos.
- La política de subtítulos converge después de cada cambio de audio, sin coordinación directa entre features.

**Non-Goals:**
- Volver a forzar el audio original después de una elección manual del usuario.
- Cambiar la regla de subtítulos (español apaga, resto enciende inglés).
- Añadir UI, opciones o permisos nuevos.
- Cubrir videos de anuncios, Shorts ni páginas fuera del watch de escritorio.

## Decisions

### Acción de bridge `applyAudioTrack` con id, resuelta en el MAIN world

El content script manda `{ action: "applyAudioTrack", audioTrackId }`. El bridge busca esa pista en `getAvailableAudioTracks()` y llama a `setAudioTrack(track)` con el objeto completo.
- Motivo: `setAudioTrack` necesita el objeto del player, no el id. Resolverlo en el MAIN world evita mandar objetos grandes por `postMessage` y evita usar un objeto viejo.
- Alternativa descartada: mandar el objeto completo desde el content script (más payload, y el objeto llega clonado sin las referencias internas del player).

### La lista de pistas entra al `PlayerSnapshot`

`availableAudioTracks` se agrega al snapshot como lista de `{ id, name, isDefault, isAutoDubbed, languageCode }`.
- Motivo: la feature de audio y la política de subtítulos leen lo mismo en el mismo ciclo de sondeo.
- Alternativa descartada: acción de bridge separada `readAudioTracks` (duplica lecturas y agrega una carrera más con el poll).

### Feature separada `original-audio-track`

La selección de audio vive en su propia feature registrada en `src/content.ts`, con su propio poll y Watch Session.
- Motivo: cada feature mantiene una responsabilidad. La política de subtítulos sigue siendo la única dueña del subtítulo.
- Alternativa descartada: meter el audio dentro de `audio-language-subtitle-policy` (mezcla dos decisiones y rompe el nombre de la feature).

### Coordinación por estado, no por mensajes

`original-audio-track` no avisa a la política de subtítulos. La política detecta el cambio porque la firma de audio cambió y vuelve a decidir en el siguiente sondeo.
- Motivo: dependencia en un solo sentido (audio → subtítulo). Menos piezas y sin acoplamiento entre features.
- Costo: hasta un ciclo de sondeo (500 ms) de retraso entre el cambio de audio y el subtítulo.
- Alternativa descartada: evento o mensaje `audio-changed` (agrega orden, suscripción y casos de fallo).

### Una firma de subtítulos más la comparación con la selección deseada

- `readSubtitleSignature` deja de incluir la pista de audio: solo `on/off` + pista de subtítulos. Esa firma decide el override y se guarda como `appliedSignature`.
- El atajo "ya aplicado" exige además `matchesSubtitleSelection(snapshot, desiredSelection)`. Si el audio cambió, la selección deseada deja de coincidir y la política vuelve a aplicar.

- Motivo: el override debe reaccionar solo a lo que el usuario cambió en subtítulos. El audio es una entrada de la política, no un veto. Una segunda firma con audio no aporta nada: la comparación con la selección deseada ya detecta el cambio.
- Alternativa descartada: mantener una firma completa con audio solo para el atajo (dos firmas con reglas parecidas y fáciles de confundir).
- Alternativa descartada: detectar gestos del usuario en el DOM (frágil y depende del reproductor).

### Una aplicación de audio por Watch Session

La feature marca la sesión como resuelta cuando la pista activa es la original. Desde ahí no vuelve a llamar a `setAudioTrack`.
- Motivo: replica el comportamiento de la extensión actual y respeta una elección manual posterior.
- Límite de reintentos: si `setAudioTrack` no cambia la pista, reintenta dentro de la sesión con un tope acotado de intentos y luego se detiene (spec: "Rechazo del player").

### Ventana de gracia desde la última aplicación

`appliedAtByVideo` se actualiza en cada aplicación, no solo la primera.
- Motivo: un apply tardío (por ejemplo, después de que carguen las pistas) deja la ventana de gracia vencida y produce falsos overrides.

## Risks / Trade-offs

- [YouTube renombra la metadata de audio] → se reutiliza `readAudioTrackMetadata`, que ya escanea alias y forma genérica.
- [YouTube reactiva el audio doblado tras un anuncio o recarga del player] → la sesión ya quedó resuelta y no se pelea; recargar la página vuelve a aplicar. Se documenta como comportamiento esperado.
- [Parpadeo de subtítulos al cambiar audio] → el cambio de audio puede reiniciar subtítulos; la política reaplica dentro de la ventana de gracia.
- [Breve corte de audio al cambiar de pista] → igual que la extensión actual. Solo ocurre cuando la pista activa está doblada.
- [Log inflado por el ciclo de registro de features] → fuera de alcance de este cambio; se atiende aparte si sigue doliendo.

## Migration Plan

1. Implementar y verificar con ambas extensiones activas: `original-audio-track` debe ganar la pista original y la política debe terminar con subtítulos correctos.
2. Con la verificación OK, desinstalar "YouTube Original Audio Track".
3. Revisar los logs `yt-utils:logs` de una carga nueva: sin `skip-overridden` por audio.
4. Rollback: reinstalar la extensión externa y desactivar nuestra feature.

## Open Questions

Ninguna pendiente.
