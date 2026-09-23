# Proposal

## Why

El feed Home muestra bloques de videos no deseados (caso actual: Clash Royale) que la extensión solo puede tratar como tarjetas genéricas. Se necesita un filtro por tema reutilizable para ocultarlos sin acción manual por tarjeta.

## What Changes

- Nueva capability `home-keyword-filter`: oculta tarjetas del Home cuyo título visible, nombre de canal o handle contiene un keyword bloqueado.
- Lista fija versionada en código para v1, con núcleo Clash Royale + jerga observada en el feed real.
- Observa el feed en vivo (scroll / SPA) y restaura las tarjetas al desactivar.
- Sin UI de configuración en v1; nuevos términos se agregan versionando la lista.

## Capabilities

### New Capabilities

- `home-keyword-filter`: filtrado por keywords en Home con lista fija, match normalizado y ocultado reversible.

### Modified Capabilities

Ninguna.

## Impact

- Nuevo `src/features/home-keyword-filter/` registrado en `src/content.ts` vía `FeatureRegistry`.
- Reutiliza `findRichItemCards`, `isDesktopHomePage` y patrón `MutationObserver` de features home existentes.
- Tests Vitest para normalización, matching y ocultar/restaurar; `npm run build` para validar paquete.
