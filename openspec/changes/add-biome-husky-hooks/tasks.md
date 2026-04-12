## 1. Tooling Setup

- [ ] 1.1 Add Biome and Husky as development dependencies.
- [ ] 1.2 Add package scripts for Biome format/check commands and Husky initialization.

## 2. Biome Configuration

- [ ] 2.1 Add a Biome config that covers the repository's TypeScript and JSON files.
- [ ] 2.2 Configure Biome to keep generated build output out of the formatting and linting scope.

## 3. Git Hooks

- [ ] 3.1 Initialize Husky hook wiring in the repository.
- [ ] 3.2 Add a `pre-commit` hook that runs Biome and `npm run typecheck`.

## 4. Verification

- [ ] 4.1 Verify Biome commands work on the current codebase.
- [ ] 4.2 Verify a commit is blocked when Biome or type checking fails.
