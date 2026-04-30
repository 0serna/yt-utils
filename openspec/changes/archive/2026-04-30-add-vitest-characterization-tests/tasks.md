## 1. Test Tooling

- [x] 1.1 Add Vitest, jsdom, and Istanbul coverage support as development dependencies
- [x] 1.2 Add Vitest configuration for TypeScript, path aliases, jsdom environment, and Istanbul coverage without thresholds
- [x] 1.3 Add `npm run test` so the test command runs Vitest and generates coverage output

## 2. Characterization Tests

- [x] 2.1 Add colocated tests for public `youtube-player-model` behavior covering subtitle selection matching and subtitle/audio signature behavior
- [x] 2.2 Add black-box bridge tests that install a fake `#movie_player`, send bridge requests, and verify snapshot responses
- [x] 2.3 Add black-box bridge tests for subtitle-selection behavior without exporting bridge internals
- [x] 2.4 Ensure tests clean up DOM, module state, and event listeners between cases

## 3. Verification

- [x] 3.1 Run `npm run test` and confirm tests pass with Istanbul-compatible coverage output
- [x] 3.2 Run `npm run build` and confirm extension build still succeeds
- [x] 3.3 Run `npm run check` diagnostically and confirm any remaining failure is known Fallow health debt, not formatting, linting, TypeScript, or OpenSpec validation
- [x] 3.4 Run `openspec validate add-vitest-characterization-tests --strict`
