# Design

## Context

See `proposal.md` for motivation. Current state: `home-keyword-filter` (`src/features/home-keyword-filter/content.ts:60-86`) hides via `display:none` + `MutationObserver` + `requestAnimationFrame`; `home-not-interested` (`src/features/home-not-interested/content.ts`) delegates to `createFeedCardOverlayActionFeature` (`src/shared/feed-card-overlay-action.ts:39-76`) which opens the card `...` menu (`findRichItemMenuButton`), waits up to 3000ms for `findNotInterestedMenuItem` (`src/shared/youtube-dom.ts:338-342`), clicks it, and relies on YouTube to mutate the card. Verified: the overlay writes no `display:none` on cards, and a `display:none` card makes its menu button fail `isVisible` (`youtube-dom.ts:405-415`), causing `ensureButton` to remove the overlay host (`feed-card-overlay-action.ts:106-119`). Both features scope to `isDesktopHomePage` and iterate `findRichItemCards()` (`ytd-rich-item-renderer`).

## Goals / Non-Goals

**Goals:**
- Replace local hiding with automatic native `No me interesa` driven by a per-topic `{channels, keywords}` registry.
- Keep manual `home-not-interested` untouched for off-topic videos.

**Non-Goals:**
- No settings UI, no `storage` persistence, no cross-page support, no custom toasts/badges, no thumbnail-vision detection.

## Decisions

- **New feature replacing `home-keyword-filter` over in-place evolution.** Rationale: the contract flips from hide+restore to act-once-natively; a new capability (`home-auto-not-interested-topics`) with the old one REMOVED keeps deltas reviewable. Alternative (same name, changed behavior) was rejected: it would hide a BREAKING semantic change.
- **Reuse `feed-card-overlay-action` queue pattern, new headless driver.** Rationale: `nativeMenuQueue`, `waitFor` timeout semantics, `AbortController` cancellation, and `hasRelevantSelectorMutation` filtering already solve menu contention and SPA churn. Alternative (fresh menu automation) was rejected: duplicates race handling. The auto driver needs no overlay button/host; it calls `findRichItemMenuButton` + `clickElement` + `waitFor(findNotInterestedMenuItem)` directly per queued card.
- **Detection = existing `readCardFilterText` + `normalizeFilterText` substring, extended to topic registry.** Rationale: `surgical goblin` substring covers `Surgical Goblin [ENG]` without maintaining handle variants; title+channel+handle sources already proven. Alternative (exact handle match) was rejected: fragile against suffixes/renames.
- **`videoId` from card `a[href*="/watch"]` `v` param, fallback to card identity.** Rationale: `findRichItemThumbnailLink` already locates watch links; `v` is stable across re-renders for dedup. Fallback (index/key) only when href is missing.
- **Session-memory dedup + attempts map with limit 3.** Rationale: prevents menu flicker loops on re-renders while allowing transient menu failures to retry on later observer passes. Alternative (persistent storage) was rejected: server already remembers Not Interested; local persistence adds staleness. Alternative (unbounded retry) was rejected: risks infinite menu churn.
- **No local fallback hiding; failures stay visible.** Rationale: preserves the verified invariant that hidden cards break menu lookup, and respects the grilled decision. Only `logger.error` on exhausted/unavailable action.
- **Observer reuse: `documentElement` `childList+subtree` with `requestAnimationFrame` coalescing, filtered to card/menu selectors.** Rationale: same cost profile as both current features; avoids `IntersectionObserver` complexity since queue is cheap and serial.

## Risks / Trade-offs

- [Native menu never appears / YouTube markup changes] → Mitigation: bounded retries + `actionUnavailableCode` error log; card stays visible, no data loss.
- [Rapid menu open/close flicker on feeds with many matches] → Mitigation: serialized queue, one menu at a time, coalesced observer passes; session dedup prevents re-clicking.
- [False positives from broad jargon (`troop`, `season`)] → Mitigation: v1 seed keeps broad terms only alongside observed channels in practice via OR match, but spec allows tightening to channel-gated rules later without contract change; review screenshot cases in tests.
- [Server-side training is not undoable from extension] → Mitigation: documented as BREAKING in proposal; scope stays Home-only and seed stays curated.
- [Card removed by YouTube mid-action] → Mitigation: reuse `isConnected`/key guards and abort semantics from overlay driver.

## Migration Plan

- Remove `home-keyword-filter` registration and `display:none`/`restoreHiddenCards` path from `src/content.ts` and feature dir (or repurpose dir into new feature), register `home-auto-not-interested-topics` in its place.
- Archive: new spec becomes `openspec/specs/home-auto-not-interested-topics/spec.md`; `home-keyword-filter` requirements removed per delta.
- Rollback: re-register old feature and revert archive; already-marked videos stay marked server-side (expected, documented).
- Validate with `openspec validate`, `npm test`, `npm run typecheck`, `npm run build`.

## Open Questions

None. Retry limit default (3) and seed list are pinned in specs; tuning them later does not change the contract shape.
