## Why

The repository currently has TypeScript and build commands, but no consistent local gate for formatting, linting, or type safety before commits. Adding a lightweight pre-commit workflow reduces noisy diffs and catches basic issues earlier.

## What Changes

- Add Biome for formatting and linting.
- Add Husky-managed Git hooks for local developer checks.
- Run Biome checks before commit to keep formatting and lint fixes close to the code change.
- Run TypeScript type checking before commit to catch type regressions early.
- Keep build validation separate from pre-commit so commits stay fast.

## Capabilities

### New Capabilities
- `developer-quality-gates`: Local pre-commit workflow that enforces formatting, linting, and type checking with Biome and Husky.

### Modified Capabilities
- None

## Impact

- `package.json` scripts and devDependencies.
- New Biome configuration files.
- New Husky hook configuration.
- Developer workflow for commit-time checks.
