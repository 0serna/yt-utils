# Tasks

## 1. Topic registry and matching

- [x] 1.1 Create per-topic `{channels, keywords}` registry with `clash-royale` v1 seed and normalized substring matcher, reusing `normalizeFilterText`, and verify unit tests cover channel variants (`Surgical Goblin [ENG]`), jargon (`electro wizard`, `mago electrico`, `troop`, `equipment`), and non-matches (`Kubernetes Simply Explained`)
- [x] 1.2 Add card `videoId` extraction from `watch?v=` href with card-identity fallback and verify unit tests cover missing href, shorts/live hrefs, and repeated renders mapping to the same id

## 2. Headless auto driver

- [x] 2.1 Implement Home-scoped auto driver with serialized native-menu queue (`findRichItemMenuButton` + `clickElement` + `waitFor(findNotInterestedMenuItem)`), session dedup by `videoId`, attempts map with limit 3, and coalesced `MutationObserver` passes, and verify unit tests mock menu open/fail paths without writing `display:none`
- [x] 2.2 Wire feature registration replacing `home-keyword-filter` in `src/content.ts` while keeping manual `home-not-interested` registered, and verify `matchesPage` is Home-only and no `display:none`/`restoreHiddenCards` path remains

## 3. Verification and validation

- [x] 3.1 Add regression tests from observed Home cases (`Hero Electro Wizard`/`Ken`, `New Troop and Equipment...`/`Judo Sloth Gaming`, `15k Push | Random Deck Challenge`, Cyrillic push title) and verify `npm test` passes
- [x] 3.2 Run `npm run typecheck`, `npm run check`, `npm run build`, and `openspec validate --change auto-not-interested-topics` and verify all exit 0
