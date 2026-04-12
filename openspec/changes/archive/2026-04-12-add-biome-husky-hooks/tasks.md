## 1. Tooling Setup

- [x] 1.1 Add Biome and Husky as development dependencies.
- [x] 1.2 Add package scripts for Biome format/check commands and Husky initialization.

## 2. Biome Configuration

- [x] 2.1 Add a Biome config that covers the repository's TypeScript and JSON files.
- [x] 2.2 Configure Biome to keep generated build output out of the formatting and linting scope.

## 3. Git Hooks

- [x] 3.1 Initialize Husky hook wiring in the repository.
- [x] 3.2 Add a `pre-commit` hook that runs Biome and `npm run typecheck`.

## 4. Verification

- [x] 4.1 Verify Biome commands work on the current codebase.
- [x] 4.2 Verify a commit is blocked when Biome or type checking fails.
