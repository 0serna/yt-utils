## 1. Fallow Configuration

- [x] 1.1 Add Fallow configuration with manifest runtime entry points for background, YouTube content, global-selection content, and MAIN-world bridge scripts
- [x] 1.2 Configure explicit Fallow health thresholds for the repository quality gate
- [x] 1.3 Ensure duplicate detection remains enabled and does not ignore all source files

## 2. Dead Code Cleanup

- [x] 2.1 Run Fallow with corrected entry points and identify remaining unused exports and type exports
- [x] 2.2 Remove verified unused exports/types without changing runtime behavior
- [x] 2.3 Confirm Fallow no longer reports reachable extension files as unused files

## 3. Verification

- [x] 3.1 Run `npm run check` and record any remaining failures expected for later dependent changes
- [x] 3.2 Run `openspec validate configure-fallow-entrypoints --strict`
