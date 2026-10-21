# Proposal

## Why

Dos fuentes de trabajo inútil quedaron visibles en la validación del cambio anterior:
1. La política de subtítulos decide con un audio que está a punto de cambiar. En el log del 14:38:13 la política apagó subtítulos con `es-US` y los volvió a encender 550 ms después, cuando `original-audio-track` terminó de aplicar `en-US`. Los subtítulos parpadean al arrancar un vídeo doblado.
2. `FeatureRegistry.register()` sincroniza en cada registro, así que una carga de página activa y desactiva todas las features una vez por feature registrada. Genera ~150 entradas de log por carga y reinicia el estado por vídeo de cada feature hasta 15 veces.

## What Changes

- Nuevo módulo compartido con una bandera en memoria de "cambio de audio en curso".
- `original-audio-track` marca la bandera antes de pedir el cambio y la limpia al confirmar la pista original, al agotar intentos o al desactivarse.
- `audio-language-subtitle-policy` no toca subtítulos mientras la bandera esté puesta; el siguiente ciclo decide con el audio nuevo.
- `FeatureRegistry.register()` deja de sincronizar. Nuevo `FeatureRegistry.start()` hace el único arranque, y `src/content.ts` lo llama después de registrar todas las features.
- Una feature registrada después de `start()` sigue activándose en ese momento.

## Capabilities

### New Capabilities

- `feature-lifecycle`: cuándo se activa y desactiva una feature respecto del registro, el arranque y los cambios de vídeo.

### Modified Capabilities

- `audio-language-subtitle-policy`: no decide subtítulos mientras hay un cambio de audio en curso.
- `original-audio-track`: anuncia el cambio de audio en curso y limpia el anuncio en todos sus finales.

## Impact

- `src/shared/audio-switch.ts`: nuevo módulo con la bandera.
- `src/features/original-audio-track/content.ts`: marca y limpia la bandera.
- `src/features/audio-language-subtitle-policy/content.ts`: salta el ciclo mientras está puesta.
- `src/shared/feature-registry.ts`: separar `register` de `start`.
- `src/content.ts`: llamar a `registry.start()`.
- Tests: `content.test.ts` de ambas features, `feature-registry.test.ts`.
