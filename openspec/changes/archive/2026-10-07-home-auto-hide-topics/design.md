# Design

## Context

See `proposal.md` - Why. The change replaces the native-action driver in `src/features/home-auto-not-interested-topics/content.ts` with local hiding. Detection stays in `topics.ts` and `readCardFilterText`. The shared overlay driver (`src/shared/feed-card-overlay-action.ts`) and the manual `home-not-interested` feature stay untouched; when a card is hidden, the overlay driver already removes its own button because the `...` menu button fails its visibility check.

Constraints:

- The feature registry deactivates all features on SPA navigation and re-activates features whose `matchesPage` returns true.
- Home cards are `ytd-rich-item-renderer` elements and YouTube may reuse an element for another video.
- No persistence layer exists for this feature and none is added.

## Goals / Non-Goals

**Goals:**

- Replace the native `No me interesa` flow with local hiding, reusing the current topic registry and observer coverage.
- Keep hidden state safe against element recycling.
- Retire the old capability with reviewable spec deltas.

**Non-Goals:**

- No `chrome.storage` persistence, no settings UI, no cross-page behavior.
- No restore on deactivation (decided: hidden cards stay hidden).
- No changes to the manual `home-not-interested` feature or to the shared overlay action.

## Decisions

- **New capability `home-auto-hide-topics` replacing `home-auto-not-interested-topics`.** Rationale: the contract flips from native action to local hiding, matching the repository precedent of a new capability plus REMOVED requirements for reviewable deltas. Alternative (same name, changed behavior) was rejected because the name would describe behavior the feature no longer has.
- **Hide with inline `display: none` plus an owned marker attribute, not an injected stylesheet.** Rationale: hidden state must survive deactivation without depending on an injected `<style>` element; an attribute also lets each observer pass find owned hidden cards for revalidation. Alternative (attribute plus stylesheet) was rejected because removing the stylesheet on deactivate would contradict the no-restore decision, and keeping it leaks global styles.
- **Revalidate owned hidden cards every observer pass.** Rationale: when YouTube reuses a hidden `ytd-rich-item-renderer` for a video without match, the card must become visible again. The previous inline `display` value is remembered per element so it can be restored. Alternative (`videoId` dedup) was rejected: it skips re-rendered cards and would keep a recycled element hidden.
- **Deletion of the action machinery: queue, `waitFor`, `AbortController`, attempts map, `MAX_AUTO_ATTEMPTS`, `video-id.ts`.** Rationale: hiding is synchronous and idempotent; there is no menu, timeout, or partial failure to retry. Alternative (keep the queue for future actions) was rejected: dead code with no owner.
- **Silent runtime: no custom UI, no runtime error logs.** Rationale: hiding has no failure mode that needs a log. Alternatives (log each hide) rejected as noise; the registry already records activation and deactivation.
- **Observation model unchanged: `documentElement` `childList+subtree` with `requestAnimationFrame` coalescing.** Rationale: same cost profile as the previous feature; no `IntersectionObserver` needed because hiding is cheap and synchronous.

## Risks / Trade-offs

- [YouTube no longer receives `No me interesa`; recommendations do not learn] → Accepted and documented as BREAKING. The manual `home-not-interested` feature remains for deliberate actions.
- [Element recycling hides a wrong card] → Revalidation restores owned hidden cards whose text no longer matches on every observer pass.
- [A full feed of matching cards leaves Home sparse and YouTube stops loading more] → Accepted: same local-hiding trade-off as the earlier `home-keyword-filter` capability; unreachable cards simply stop occupying space.
- [YouTube changes the card selector or menu markup] → Hiding depends only on `ytd-rich-item-renderer`; detection already had the same exposure. Tests pin the selector.
- [Hidden cards are not restored when the extension is disabled] → Same class of limitation as any DOM-owning feature; a page reload clears it.

## Migration Plan

- Rename `src/features/home-auto-not-interested-topics/` to `src/features/home-auto-hide-topics/`; rewrite `content.ts` as scan plus hide/revalidate; delete `video-id.ts`; rewrite `content.test.ts`; keep `topics.ts`.
- Update the import and registration in `src/content.ts`; keep `home-not-interested` registered.
- Update the `GLOSSARY.md` entry that still describes the removed `home-keyword-filter` feature.
- Archive: `home-auto-hide-topics` becomes a new spec; `home-auto-not-interested-topics` requirements are removed per delta.
- Rollback: revert the commit; the archived `home-auto-not-interested-topics` spec and code remain in git history.
- Validate with `npm test`, `npm run typecheck`, `npm run check`, `npm run build`, and `openspec validate`.
