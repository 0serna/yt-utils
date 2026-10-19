# Proposal

## Why

Each git worktree builds its own `extension/` directory. Chrome binds an unpacked extension to one absolute path, so every worktree becomes a separate entry with its own ID and storage. Testing a worktree means loading, removing, or switching directories in `chrome://extensions`.

## What Changes

- Resolve Vite's `build.outDir` to the main checkout's `extension/` directory, derived with `git rev-parse --path-format=absolute --git-common-dir`. All worktrees then build into the same loadable directory.
- Allow `EXTENSION_OUT_DIR` to override the resolved path for a dedicated output location.
- Keep `emptyOutDir: true`, so the shared directory never keeps stale assets.
- Serialize concurrent builds with a file lock, so two worktrees cannot interleave output in the shared directory.
- Update `README.md` and `AGENTS.md` with the single-directory load and build workflow.

No extension behavior changes. **BREAKING** for the developer workflow: existing per-worktree extension entries and their separate storage are not migrated.

## Capabilities

### New Capabilities

None. This change only affects build tooling, so it sets `skip_specs: true`.

### Modified Capabilities

None.

## Impact

- `vite.config.ts`: `build.outDir` and `emptyOutDir`.
- `package.json`: `build` script lock.
- `README.md` and `AGENTS.md`: build and load instructions.
- CI is unchanged: in a normal checkout the common dir is the checkout root, so the output stays `<checkout>/extension`.
- `chrome://extensions`: one unpacked entry instead of one per worktree.
- The build lock is a POSIX dependency (Linux and Ubuntu CI). macOS is not covered.
