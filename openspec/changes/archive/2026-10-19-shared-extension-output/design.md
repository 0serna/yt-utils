# Design

## Context

`vite.config.ts` builds with `@crxjs/vite-plugin` into `extension/` relative to the worktree root. `extension/` is gitignored. Chrome derives an unpacked extension's ID from its absolute path, so each worktree path gets an independent entry and storage. CI builds in a normal checkout, where the output is `<checkout>/extension`.

Constraints:
- `npm run build` must keep working from any worktree without extra setup.
- CI must keep working without configuration.
- The generated directory must remain loadable as-is.
- The repository may be a main checkout plus Git worktrees.

See `proposal.md` for motivation.

## Goals / Non-Goals

**Goals:**
- One stable loadable directory for all worktrees.
- Zero per-worktree environment configuration.
- Stable extension ID and storage across worktree builds.
- No stale output in the shared directory.

**Non-Goals:**
- Changing extension behavior or the manifest.
- Migrating storage from old per-worktree extension entries.
- HMR or a dev-server workflow.
- A dedicated external extension host directory. The environment override leaves room for it.
- Parallel builds without waiting.

## Decisions

### 1. Derive the main checkout from Git

Run `git rev-parse --path-format=absolute --git-common-dir` in `vite.config.ts`. In a worktree it returns `<main>/.git`; the parent is the main checkout. The output is then `<main>/extension`.
- Why: no machine-specific path in the repo.
- Why: in CI the common dir is `<checkout>/.git`, so the output stays `<checkout>/extension`.
- Alternative rejected: `__dirname/../..` resolves to the worktrees parent, not the main checkout.
- Alternative rejected: a hardcoded home path is not portable.

### 2. Fall back to the local `extension/`

If Git is unavailable or the command fails, use `resolve(__dirname, "extension")`.
- Why: a build must not fail only because the checkout is not a Git worktree (tarball, shallow copy).
- Cost: three lines in the resolver.

### 3. Allow `EXTENSION_OUT_DIR` to override the path

- Why: an escape hatch for a dedicated output directory or a CI artifact, with no extra config file.
- Alternative rejected: a `.env` file per worktree is untracked and must be recreated.

### 4. Keep `emptyOutDir: true`

Vite does not empty an outDir outside the project root by default. The explicit `true` removes stale assets from the shared directory.

### 5. Serialize builds with `flock`

Wrap the build as `flock /tmp/yt-utils-build.lock vite build`.
- Why: the shared directory creates a write race when two worktrees build at once. The second build waits instead of interleaving files.
- Trade-off: POSIX-only. macOS needs `flock` installed. Accepted for Linux dev and Ubuntu CI.
- Alternative rejected: build to a temp directory and swap it in. More code, and Chrome's behavior with a swapped symlink is uncertain.
- Alternative rejected: no lock. A mixed build produces a broken extension.

### 6. Do not add a manifest `key` or build-name suffix

A stable path already gives a stable ID. A name suffix would help identify the loaded build, but it is not required for this change.

## Risks / Trade-offs

- **Last build wins**: a build from another worktree replaces the loaded code. → Reload after the intended build; the branch is visible in the terminal or agent.
- **Existing entries and storage do not migrate**: → Remove the old per-worktree entries once and load the shared directory. Old `chrome.storage.local` data is lost.
- **The main checkout must exist**: → If it moves, Chrome needs a new load and gets a new ID.
- **Two builds at once**: → `flock` serializes them; the second waits.
- **`flock` missing on macOS**: → Install it, or remove the lock there.
- **Build writes into the main checkout**: → `extension/` is gitignored; no tracked files change.
- **Git older than 2.31 lacks `--path-format`**: → Fallback to the local `extension/`; the build does not fail.

## Migration Plan

1. Build once from any worktree.
2. In `chrome://extensions`, remove the old per-worktree entries.
3. Load unpacked `<main checkout>/extension` once.
4. For later worktree changes, run `npm run build` and reload the single entry.

Rollback: revert `vite.config.ts` and `package.json`. Each worktree builds to its local `extension/` again. No data migration is needed.
