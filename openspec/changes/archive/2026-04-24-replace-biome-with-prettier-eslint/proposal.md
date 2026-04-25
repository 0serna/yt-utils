## Why

Biome bundles formatting and linting into a single tool. Splitting into Prettier (formatting) + ESLint (linting) gives more granular control over lint rules, better ecosystem compatibility, and follows the more widely-adopted tooling pattern in the TypeScript ecosystem.

## What Changes

- **BREAKING**: Replace `@biomejs/biome` with `prettier` and `eslint` (with `typescript-eslint` and `eslint-config-prettier`).
- Replace `biome.json` with `.prettierrc` and `eslint.config.mjs` (flat config).
- Update `npm run check` to run Prettier + ESLint instead of Biome.
- Update `.husky/pre-commit` to run Prettier format and ESLint fix on staged files.
- Remove `biome check --write` from pre-commit; add separate `prettier --write` and `eslint --fix` steps.

## Capabilities

### New Capabilities

- `prettier-formatting`: Prettier-based code formatting with project-specific configuration.
- `eslint-linting`: ESLint-based TypeScript linting using the `typescript-eslint` recommended ruleset with flat config.

### Modified Capabilities

- `build-pipeline`: Replace "Biome reports no issues" with "Prettier and ESLint report no issues" in the validation requirement.
- `developer-quality-gates`: Replace all Biome-specific requirements with Prettier + ESLint equivalents. Git hooks still gate commits but now use Prettier + ESLint.

## Impact

- Dependencies: remove `@biomejs/biome`, add `prettier`, `eslint`, `typescript-eslint`, `eslint-config-prettier`
- Config: delete `biome.json`, create `.prettierrc` and `eslint.config.mjs`
- Scripts: update `check` in `package.json`
- Hooks: rewrite `.husky/pre-commit`
- No application code changes (purely dev tooling)
