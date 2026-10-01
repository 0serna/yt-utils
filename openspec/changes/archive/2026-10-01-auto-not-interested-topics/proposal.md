# Proposal

## Why

El filtro actual oculta por `display:none` y solo matchea texto con `clash` o jerga conocida. En el Home real siguen apareciendo tarjetas de Clash Royale (`Hero Electro Wizard`, `New Troop and Equipment in October Season!`, `15k Push | Random Deck Challenge`, canales `Judo Sloth Gaming`, `Surgical Goblin`, `KJ Maggard`, `Mamoyan`, `Ken`) sin ninguna keyword bloqueada en el texto visible. Además, ocultar localmente no entrena el algoritmo de YouTube, por lo que el tema vuelve a aparecer.

## What Changes

- Nuevo motor genérico por temas `topic -> {channels, keywords}` fijo en código, primera semilla `clash-royale`.
- Detección por substring normalizado (minúsculas, sin tildes) sobre título, nombre de canal y handle; un match de canal o de keyword basta.
- En lugar de `display:none`, dispara la acción nativa `No me interesa` en cola serializada al detectar la tarjeta (render inicial, scroll o re-render SPA).
- Deduplicación una vez por `videoId` en memoria de sesión, con límite de reintentos (ej. 3); si se agota, la tarjeta queda visible.
- Alcance solo Home desktop (`www.youtube.com/` con `pathname === "/"`).
- **BREAKING**: se retira el ocultado local de `home-keyword-filter`; el efecto visual pasa a depender de YouTube tras el click nativo.
- Se mantiene el botón manual `home-not-interested` para videos fuera de temas.

## Capabilities

### New Capabilities

- `home-auto-not-interested-topics`: automatiza `Not Interested` nativo para temas no deseados en Home, con registry por temas, detección canal+keyword, cola serializada, dedup por sesión y límite de reintentos.

### Modified Capabilities

- `home-keyword-filter`: se retira su REQUIREMENT de ocultado local con `display:none` y restauración; queda superseded por `home-auto-not-interested-topics`.

## Impact

- Afecta `src/features/home-keyword-filter/` (a retirar/reemplazar), nuevo feature auto bajo `src/features/`, reutiliza `src/shared/feed-card-overlay-action.ts` (`nativeMenuQueue`, `waitFor` 3000ms) y `src/shared/youtube-dom.ts` (`findRichItemCards`, `findNotInterestedMenuItem`, `isVisible`).
- Sin cambios de API pública ni dependencias nuevas; sin UI propia, solo `logger.error` si se agota el límite.
- Riesgo conocido: entrena recomendaciones del lado servidor (no reversible desde la extensión) y depende del menú nativo de YouTube.
