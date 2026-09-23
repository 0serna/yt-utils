# Tasks

## 1. Filtrado base

- [x] 1.1 Crear `src/features/home-keyword-filter/keywords.ts` con lista fija Clash y normalización, y verificar con test de `includes` para `CLASH ROYALE`, `クラロワ`, `BENIJU` y no-match tech
- [x] 1.2 Implementar `src/features/home-keyword-filter/content.ts` con `matchesPage`, ocultar/restaurar y observer, y verificar que tarjetas coincidentes quedan con `display:none` y las demás visibles
- [x] 1.3 Registrar el feature en `src/content.ts` y verificar con `npm run typecheck` sin errores

## 2. Cobertura dinámica y regresión

- [x] 2.1 Agregar tests de feed dinámico (scroll/SPA) y restauración en `deactivate`, y verificar con `npm test -- home-keyword-filter` en verde
- [x] 2.2 Agregar casos tech de no-regresión y variantes JP/KR/handle, y verificar que `npm test` completo pasa

## 3. Calidad y paquete

- [x] 3.1 Ejecutar `npm run check` y `npm run build`, y verificar que ambos terminan con exit 0
