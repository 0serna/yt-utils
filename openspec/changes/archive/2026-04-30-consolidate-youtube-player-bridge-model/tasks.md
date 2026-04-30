## 1. Shared Player Model

- [x] 1.1 Add a pure shared player bridge model module for protocol constants, request/response types, snapshot types, and track types
- [x] 1.2 Move shared normalization and signature helpers into the player model module when they are safe in both worlds
- [x] 1.3 Confirm the shared module has no Chrome API usage, feature lifecycle state, or top-level DOM side effects

## 2. Bridge and Client Refactor

- [x] 2.1 Update `src/main-world/youtube-player-bridge.ts` to import shared model definitions and keep YouTube player API access local
- [x] 2.2 Update `src/shared/youtube-player.ts` to import shared model definitions and keep request orchestration local
- [x] 2.3 Preserve bridge source string, request shape, response shape, and snapshot fields

## 3. Verification

- [x] 3.1 Run `npm run check` and confirm targeted player bridge duplicate groups are removed or reduced as expected
- [x] 3.2 Run `npm run build` to verify MAIN-world shared imports bundle correctly
- [x] 3.3 Manually validate YouTube player snapshot consumers, especially subtitle policy and ask auto-open behavior
- [x] 3.4 Run `openspec validate consolidate-youtube-player-bridge-model --strict`
