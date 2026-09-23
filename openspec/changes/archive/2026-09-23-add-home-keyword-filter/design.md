# Design

## Context

Ver `proposal.md` para motivación. Estado actual: features home usan `ytd-rich-item-renderer` vía `findRichItemCards` y `isDesktopHomePage`, con `MutationObserver` + `requestAnimationFrame` como en `home-playables-removal`. No existe clasificación por tema; el feed real muestra títulos, canal y handle en DOM, sin metadato de juego.

## Goals / Non-Goals

**Goals:**

- Ocultar en Home tarjetas Clash con match de texto visible y restaurar al desactivar.
- Lista fija extensible a futuros temas sin UI en v1.
- Reutilizar helpers y patrones existentes de features home.

**Non-Goals:**

- Página de opciones / storage editable.
- OCR de miniaturas o fetch de watch page.
- Filtrar suscripciones, búsqueda o relacionados.

## Decisions

- **Módulo `home-keyword-filter` con `keywords.ts` separado**: separa lista versionada de la lógica DOM; alternativa monolítica descartada por dificultar agregar términos.
- **Match `includes` normalizado (lower + NFD sin diacríticos) sobre título + canal + handle**: cubre `BENIJU`, `BaleGG`, `クラロワ` sin API; regex libre descartado por riesgo; fetch de descripción descartado por costo/ruido.
- **Ocultar con `display:none` + atributo `data-` y restaurar en `deactivate`**: reversible sin recarga; eliminar del DOM descartado porque exige recarga, como hace playables-removal.
- **Observer `childList+subtree` con throttle `requestAnimationFrame`**: igual que playables-removal para scroll/SPA; filtrado solo en primera carga descartado porque pierde tarjetas.

## Risks / Trade-offs

- [Jerga amplia (`mazo`, `ciclo`, `supercell`) puede ocultar de más] → Mitigación: lista v1 acotada a variantes observadas y tests de no-regresión con feed tech.
- [Videos solo con señal en miniatura imagen se pierden] → Mitigación: documentado como limitación; cubrir por canal cuando sea estable.
- [`clash` solo confunde CR con CoC] → Mitigación: exigir `clash royale` / variantes, no `clash` aislado.
- [Observer en feed infinito] → Mitigación: reutilizar patrón throttle existente y selectores acotados.

## Migration Plan

- Agregar feature y registrar en `src/content.ts`; rollback: quitar registro. Sin migración de datos.

## Open Questions

Ninguna que bloquee specs o tareas.
