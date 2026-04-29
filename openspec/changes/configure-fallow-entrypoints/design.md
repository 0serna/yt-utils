## Context

The repository is a Chrome MV3 extension built with Vite and `@crxjs/vite-plugin`. Runtime entry points are declared in `manifest.json`, not as a conventional web application root. Fallow's default discovery can miss that shape and classify reachable content scripts, background scripts, and MAIN-world scripts as unused.

This change establishes Fallow as a strict quality gate with correct entry point knowledge before subsequent refactors remove duplicate code.

## Goals / Non-Goals

**Goals:**

- Configure Fallow with the extension's actual runtime roots.
- Keep `fallow --fail-on-issues` in the unified check path.
- Remove unused exports and type exports that are truly unused after entry points are correct.
- Avoid broad duplicate-code suppression such as ignoring all of `src/`.
- Make health thresholds explicit so future failures reflect agreed limits.

**Non-Goals:**

- Removing all duplicate code in this change.
- Redesigning feature lifecycle code, player bridge code, or injected automation.
- Changing extension behavior intentionally.

## Decisions

- Add a Fallow config file with manual entries for `src/background.ts`, `src/content.ts`, `src/global-selection.ts`, and `src/main-world/youtube-player-bridge.ts` because those are the runtime roots declared by `manifest.json`.
- Keep duplicate detection enabled and blocking rather than disabling it globally, even though the broader cleanup series may remain red until duplicate code is removed.
- Remove only unused exports/types that are verified as unused by the corrected graph. This avoids treating Fallow setup as a behavioral refactor.
- Use explicit health thresholds to make the quality gate intentional. Complexity that naturally improves during later extraction work can lower measured risk, but this change does not chase every complex function.

## Risks / Trade-offs

- The first change in the series may leave `npm run check` failing on duplicate code until dependent refactors land. → Treat the four changes as a dependent cleanup series with final green validation.
- Manual entry points can drift if `manifest.json` changes. → Keep Fallow entries aligned with manifest runtime roots when adding extension entry points.
- Removing exports can break undocumented external usage only if source modules are consumed outside the repository. → The extension is private and source modules are internal.
