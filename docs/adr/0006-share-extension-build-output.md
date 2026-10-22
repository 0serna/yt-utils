# Build every worktree into the main checkout's `extension/` directory

`vite.config.ts` resolves the output to `<git-common-dir>/../extension` and falls back to the local `extension/` when Git fails. `EXTENSION_OUT_DIR` overrides the path, `emptyOutDir` stays on, and `flock` serializes builds. Chrome binds an unpacked extension to one absolute path, so per-worktree outputs created separate extension entries with separate IDs and storage.

**Consequences**: the last build wins, so reload after the build you intend to test. The lock is POSIX-only. Existing per-worktree extension entries and their storage are not migrated.
