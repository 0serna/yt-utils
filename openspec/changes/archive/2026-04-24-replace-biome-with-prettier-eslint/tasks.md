## 1. Dependencies

- [x] 1.1 Remove `@biomejs/biome` from `devDependencies` in `package.json`
- [x] 1.2 Run `npm install` to clean up the removed package
- [x] 1.3 Add `prettier` to `devDependencies` in `package.json`
- [x] 1.4 Add `eslint` to `devDependencies` in `package.json`
- [x] 1.5 Add `typescript-eslint` to `devDependencies` in `package.json`
- [x] 1.6 Add `eslint-config-prettier` to `devDependencies` in `package.json`
- [x] 1.7 Run `npm install` to install new packages
- [x] 1.8 Delete `biome.json`

## 2. Prettier Configuration

- [x] 2.1 Create `.prettierrc` with `singleQuote: false` for TypeScript and JSON parser for JSON files
- [x] 2.2 Create `.prettierignore` excluding `extension/manifest.json`, `node_modules/`, and `dist/`

## 3. ESLint Configuration

- [x] 3.1 Create `eslint.config.mjs` with flat config importing `typescript-eslint`
- [x] 3.2 Configure TypeScript ESLint `recommended` ruleset for `src/**/*.ts` and `vite.config.ts`
- [x] 3.3 Add `eslint-config-prettier` as the last config entry to disable conflicting rules
- [x] 3.4 Set `ignores` to exclude `extension/`, `node_modules/`, `dist/`, and JSON files

## 4. Scripts & Pre-commit Hook

- [x] 4.1 Update `check` script in `package.json` to run `prettier --check . && eslint . && tsc --noEmit && openspec validate --all --json`
- [x] 4.2 Rewrite `.husky/pre-commit` to run `prettier --write` and `eslint --fix` on staged files, then `npm run check`

## 5. Format & Verify

- [x] 5.1 Run `prettier --write .` to format the codebase and commit formatting changes
- [x] 5.2 Run `eslint --fix .` to auto-fix any ESLint violations and commit
- [x] 5.3 Run `npm run check` to verify Prettier + ESLint + tsc + openspec all pass
- [x] 5.4 Run `openspec validate --changes --all --json` to verify OpenSpec artifacts are valid
