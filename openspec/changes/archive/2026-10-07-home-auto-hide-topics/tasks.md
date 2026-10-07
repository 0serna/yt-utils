# Tasks

## 1. Rename and local hiding engine

- [x] 1.1 Rename `src/features/home-auto-not-interested-topics/` to `src/features/home-auto-hide-topics/`, rename the feature `name` to `home-auto-hide-topics`, update the import and registration in `src/content.ts`, and delete `video-id.ts`; verify `npm run typecheck` exits 0 and no source file references `home-auto-not-interested-topics` or `video-id`
- [x] 1.2 Rewrite the feature logic so each observer pass hides matching cards with an owned marker plus inline `display:none`, remembers each card's previous inline display, revalidates owned hidden cards and restores them when their text stops matching, and starts/stops a coalesced observer without queue, `waitFor`, attempts, abort controllers, or runtime logs; verify unit tests cover hide, revalidate/restore, and idempotent repeated passes (`npm test`)
- [x] 1.3 Rewrite `content.test.ts`: keep the matcher coverage for channel, jargon, normalization, and non-match cases; remove the `videoId` suite; replace the feature cases with assertions that no native menu or `No me interesa` click happens, non-matching cards stay untouched, a recycled card is restored, and deactivation stops observing while hidden cards stay hidden; verify `npm test` exits 0
- [x] 1.4 Update `GLOSSARY.md` to replace the stale `home-keyword-filter` entry with `home-auto-hide-topics` and verify the glossary no longer names a removed feature

## 2. Integration checks

- [x] 2.1 Run `npm test`, `npm run typecheck`, `npm run check`, and `npm run build` and verify all exit 0
- [x] 2.2 Run `openspec validate home-auto-hide-topics --strict` and verify it exits 0; confirm the feature code has no native menu path and `home-not-interested` stays registered in `src/content.ts`

## Workflow follow-up

- After the user reloads the extension in the browser, verify on Home that matching cards are hidden without any card menu opening and unrelated cards stay visible.
- Archive the change after review.
- Verify the archived result: new `home-auto-hide-topics` spec added and the `home-auto-not-interested-topics` spec removed.
