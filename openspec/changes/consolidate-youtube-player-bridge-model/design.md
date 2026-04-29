## Context

The extension uses a MAIN-world bridge to access YouTube player internals and an isolated-world client to request snapshots and subtitle actions via `window.postMessage`. Both sides currently need the same protocol vocabulary and portions of the same pure player model logic, which creates duplicated definitions and helper code.

The MAIN-world script can import shared modules as long as those modules are pure and bundled into the content script entry by Vite/CRX.

## Goals / Non-Goals

**Goals:**

- Centralize bridge protocol types and constants.
- Centralize pure player model helpers that are safe in both MAIN-world and isolated-world contexts.
- Preserve the existing message protocol shape and behavior.
- Validate that the bundled extension still includes the MAIN-world bridge correctly.

**Non-Goals:**

- Changing how the bridge communicates (`window.postMessage` remains the boundary).
- Changing subtitle selection behavior or audio language policy behavior.
- Moving DOM/player access logic out of the MAIN-world bridge.

## Decisions

- Create or update a pure shared model module for bridge types, `BRIDGE_SOURCE`, snapshot shape, caption/audio track types, normalization helpers, and signature helpers where they are not runtime-specific.
- Keep YouTube DOM/player API access in `src/main-world/youtube-player-bridge.ts` because only the MAIN world can access page-owned player internals reliably.
- Keep bridge request orchestration in `src/shared/youtube-player.ts` because isolated-world consumers should not know MAIN-world implementation details.
- Avoid importing modules with Chrome APIs, mutable feature state, or DOM side effects from the MAIN-world bridge.

## Risks / Trade-offs

- Shared imports may affect how the MAIN-world entry is bundled. → Run `npm run build` and validate the extension bridge on YouTube.
- Over-sharing could leak isolated-world assumptions into MAIN-world code. → Limit the shared module to types, constants, and pure functions.
- Protocol changes could break consumers silently. → Preserve request/response fields and keep bridge source string stable.
