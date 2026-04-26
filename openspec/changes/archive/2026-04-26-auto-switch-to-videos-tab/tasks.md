## 1. Create the feature module

- [x] 1.1 Create `src/features/auto-switch-to-videos-tab/content.ts` with the `Feature` object
- [x] 1.2 Implement `matchesPage()` to match all channel URL formats (`/@handle/*`, `/c/*`, `/user/*`, `/channel/*`)
- [x] 1.3 Implement `activate()` to wait for the tablist, check if "Home" is selected, verify sessionStorage flag, click "Videos" tab, and set the flag
- [x] 1.4 Implement `deactivate()` as a no-op (no persistent observers or timers)

## 2. Integrate with the extension

- [x] 2.1 Import the new feature in `src/content.ts`
- [x] 2.2 Register the feature in the `FeatureRegistry`

## 3. Verify and validate

- [x] 3.1 Run `npm run check` to ensure lint/format and type checks pass
- [x] 3.2 Build the extension with `npm run build`
- [x] 3.3 Test manually on a YouTube channel: navigate to Home, confirm auto-switch to Videos, navigate back to Home, confirm no second auto-switch
