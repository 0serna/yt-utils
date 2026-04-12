## 1. Player policy plumbing

- [ ] 1.1 Create a new watch-page feature module for audio-language subtitle policy and register it from `src/content.ts`
- [ ] 1.2 Add main-world player helpers that read the live YouTube player state for active audio language, available caption tracks, and current subtitle state
- [ ] 1.3 Add player mutation helpers that enable subtitles, select direct English, select auto-translated English, disable subtitles, and verify the applied result

## 2. Policy behavior

- [ ] 2.1 Implement policy evaluation that classifies Spanish audio, non-Spanish audio with direct English, non-Spanish audio with auto-English fallback, and videos with no English route
- [ ] 2.2 Implement per-video bookkeeping so the feature applies its policy once per video and detects manual subtitle or audio overrides afterward
- [ ] 2.3 Integrate the policy with watch-page activation and SPA navigation so it runs for the active video without adding visible UI

## 3. Validation

- [ ] 3.1 Verify the feature against watch-page scenarios for Spanish audio, direct English subtitles, auto-translated English fallback, and no-English fallback
- [ ] 3.2 Run project validation commands and address any typecheck or build issues introduced by the feature
