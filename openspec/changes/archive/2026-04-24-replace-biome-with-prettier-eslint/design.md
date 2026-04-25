## Context

The project currently uses `@biomejs/biome` ^2.4.11 for both formatting and linting. Biome is configured in `biome.json` with double-quote style, covering `src/**/*.ts`, root-level `*.json`, `openspec/**/*.json`, and `vite.config.ts` (excluding `extension/manifest.json`). The `check` script runs `biome check --write . && tsc --noEmit && openspec validate`. The pre-commit hook runs `biome check --write` on staged files and then `npm run check`.

The migration replaces Biome with Prettier (formatting) and ESLint (linting), keeping them as separate tools with `eslint-config-prettier` to disable ESLint rules that conflict with Prettier.

## Goals / Non-Goals

**Goals:**

- Replace Biome formatting with Prettier, matching the existing style (double quotes, same file scope).
- Replace Biome linting with `typescript-eslint` recommended rules via ESLint flat config.
- Integrate Prettier and ESLint so they don't conflict (via `eslint-config-prettier`).
- Update `npm run check` and `.husky/pre-commit` to use the new tools.

**Non-Goals:**

- Introducing `eslint-plugin-prettier` (formatting stays in Prettier, not in ESLint).
- Adding `recommended-type-checked` or `strict` TypeScript ESLint rulesets (can be done later).
- Changing any application code — this is purely dev tooling.

## Decisions

### 1. ESLint flat config (`eslint.config.mjs`)

**Choice**: ESLint flat config over legacy `.eslintrc.json`.

**Rationale**: Flat config is the default since ESLint 9.x, is simpler (no `extends` chains, explicit plugin imports), and the project has no legacy ESLint config to migrate. TypeScript ESLint's recommended config is flat-config-native as of v8.

**Alternatives considered**: `.eslintrc.json` (legacy) — rejected because it's deprecated and the project is starting fresh.

### 2. Separate Prettier + ESLint (not `eslint-plugin-prettier`)

**Choice**: Run Prettier and ESLint as separate commands, with `eslint-config-prettier` disabling conflicting ESLint rules.

**Rationale**: Faster execution (no Prettier running inside ESLint), cleaner separation of concerns, and avoids the known edge cases of `eslint-plugin-prettier` (e.g., large files causing timeouts). The user explicitly chose `eslint-config-prettier`.

**Alternatives considered**: `eslint-plugin-prettier` — rejected per user preference and for speed.

### 3. `typescript-eslint` recommended ruleset

**Choice**: Use `recommended` (not `recommended-type-checked` or `strict`).

**Rationale**: The project currently has 0 Biome lint issues across 32 files. Introducing `recommended-type-checked` (~80 rules, requires type info) would likely surface new issues unrelated to the migration, adding scope creep. The `recommended` set (~40 rules) provides solid baseline type-aware linting without being overwhelming. Strictness can be increased in a follow-up change.

### 4. File scope matching current Biome config

**Choice**: Prettier and ESLint cover the same files Biome currently covers: `src/**/*.ts`, root `*.json` (excluding `extension/manifest.json`), `openspec/**/*.json`, and `vite.config.ts`.

**Rationale**: No reason to expand or shrink scope during migration. The `.prettierignore` and ESLint `ignores` field replicate the existing `biome.json` includes/excludes pattern.

### 5. Prettier config via `.prettierrc` with explicit options

**Choice**: Create `.prettierrc` with `singleQuote: false` (default, matching current Biome double-quote style) and explicit file overrides for JSON.

**Rationale**: Explicit config prevents surprises if Prettier defaults change. JSON files use `"json"` parser, TypeScript uses default parser.

## Risks / Trade-offs

| Risk                                                                                              | Mitigation                                                                                                                  |
| ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| First Prettier format run may produce a diff (Biome and Prettier formatting isn't 100% identical) | Run `prettier --write .` as part of the migration, commit the format-only changes before enabling the pre-commit hook       |
| Some Biome lint rules have no exact ESLint equivalent                                             | Acceptable — the `recommended` TypeScript ESLint ruleset is well-established and covers the most important TS safety checks |
| New dependencies increase install time                                                            | Negligible — Prettier + ESLint + typescript-eslint is a common stack with fast install times                                |
| ESLint flat config has less community documentation than legacy                                   | The typescript-eslint docs have excellent flat config examples; config is simple enough to be self-documenting              |
