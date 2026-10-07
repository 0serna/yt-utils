# Proposal

## Why

El feature actual abre el menú nativo `...` de YouTube y hace clic en `No me interesa` por cada tarjeta del tema. Eso implica cola serializada, esperas, reintentos y entrenamiento del algoritmo en el servidor. El usuario quiere algo más simple y silencioso: solo ocultar la tarjeta localmente, sin tocar el flujo nativo.

## What Changes

- Al detectar una tarjeta de un tema bloqueado, el feature la oculta con `display:none` propio en lugar de abrir el menú `...` y pulsar `No me interesa`.
- El feature y la capability se renombran de `home-auto-not-interested-topics` a `home-auto-hide-topics`, porque el contrato deja de ser la acción nativa.
- Se elimina la maquinaria de acción nativa: cola serializada, `waitFor`, `AbortController`, límite de reintentos y dedup por `videoId` (`video-id.ts`). Ocultar es idempotente.
- Cada pasada del observer reevalúa las tarjetas ocultas. Si YouTube reutiliza un elemento para otro video sin match, la tarjeta se vuelve a mostrar.
- Al desactivar, el feature deja de escanear y las tarjetas ocultas permanecen ocultas hasta que YouTube las recree o se recargue la página.
- **BREAKING**: YouTube ya no recibe `No me interesa`; las recomendaciones no cambian. El efecto queda local a la página y es por sesión.
- El botón manual `home-not-interested` no cambia.

## Capabilities

### New Capabilities

- `home-auto-hide-topics`: oculta localmente tarjetas de Home que coinciden con el registry de temas, sobre feed dinámico y con reevaluación de elementos reciclados.

### Modified Capabilities

- `home-auto-not-interested-topics`: se retiran sus requisitos de acción nativa, cola serializada, dedup y reintentos; la capability queda superseded por `home-auto-hide-topics`.

## Impact

- `src/features/home-auto-not-interested-topics/` se renombra a `src/features/home-auto-hide-topics/`; `content.ts` se reescribe como scan + ocultar/reevaluar; `video-id.ts` se elimina; `content.test.ts` se reescribe; `topics.ts` no cambia.
- `src/content.ts`: actualiza import y registro del feature (nombre nuevo).
- `GLOSSARY.md`: la entrada de `home-keyword-filter` está obsoleta; se alinea con el nombre nuevo.
- Sin cambios de API pública, dependencias ni storage. Sin UI propia ni logs de runtime nuevos.
- Validación: `npm test`, `npm run typecheck`, `npm run check`, `npm run build`, `openspec validate`.
