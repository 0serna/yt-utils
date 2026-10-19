# Tasks

## 1. Shared output directory

- [x] 1.1 Add `resolveOutDir()` to `vite.config.ts`: use `EXTENSION_OUT_DIR` when set, otherwise derive `<main checkout>/extension` with `git rev-parse --path-format=absolute --git-common-dir`, otherwise fall back to `resolve(__dirname, "extension")`. Keep `build.emptyOutDir: true`. Verify `npm run build` succeeds and writes `manifest.json` to the main checkout's `extension/`.
- [x] 1.2 Change the `build` script in `package.json` to `flock /tmp/yt-utils-build.lock vite build`. Verify two concurrent `npm run build` runs both exit 0 and the final output is one coherent build.
- [x] 1.3 Update `README.md`: builds from any worktree write to the main checkout's `extension/`, and Chrome loads that one directory. Verify the documented path and commands match `vite.config.ts`.
- [x] 1.4 Update `AGENTS.md`: worktree builds write to the shared `extension/`, and the user reloads the single loaded entry. Verify the workflow text matches the new behavior.

## 2. Integration verification

- [x] 2.1 Run `npm run build` from this worktree and verify `<main checkout>/extension/manifest.json` exists and no `extension/` directory is created in the worktree.
- [x] 2.2 Run `npm run build` from the main checkout and verify it rebuilds the same `<main checkout>/extension` directory.
- [x] 2.3 Run `npm run check`, `npm run typecheck`, and `npm test`; all pass.
- [x] 2.4 Manual, user: remove the old per-worktree entries in `chrome://extensions`, load `<main checkout>/extension` once, and reload it after a worktree build. Verify the extension works and `chrome.storage.local` persists across reloads.
