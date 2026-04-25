## Context

The repository is a small TypeScript-based Chrome extension built with Vite. It already has `build` and `typecheck` scripts, but no standardized local quality gate for formatting or linting before commits.

This change adds developer-facing tooling, not product behavior. The main constraint is to keep the workflow simple and fast enough that contributors will actually use it.

## Goals / Non-Goals

**Goals:**

- Enforce consistent formatting and basic linting with Biome.
- Run type checking before commits complete.
- Keep the hook setup easy to install and maintain with Husky.
- Avoid adding unnecessary workflow complexity.

**Non-Goals:**

- Adding a full ESLint/Prettier stack.
- Running production builds on every commit.
- Changing extension runtime behavior or OpenSpec product specs.

## Decisions

- Use Biome as the single formatting and linting tool.
  - Rationale: it replaces the common ESLint + Prettier split with one config and one command surface.
  - Alternative considered: ESLint + Prettier, rejected for extra setup and maintenance.

- Use Husky to manage Git hooks.
  - Rationale: it is a standard, explicit hook manager and makes the workflow obvious to contributors.
  - Alternative considered: native `.git/hooks` scripts, rejected because they are not repository-scoped and are harder to share.

- Run Biome and `npm run typecheck` in `pre-commit`.
  - Rationale: formatting/linting and type safety are cheap enough to block bad commits early.
  - Alternative considered: also running `npm run build` in `pre-commit`, rejected because it slows commits without improving the immediate developer feedback loop much.

- Keep build validation outside the commit hook.
  - Rationale: build failures are better surfaced in CI or a later manual check than during every commit.

## Risks / Trade-offs

- [Hook latency] → Keep the hook limited to Biome and type checking only.
- [Tooling churn] → Keep configuration minimal and prefer defaults where possible.
- [Contributor bypass] → Document the hook behavior in the repository setup flow and rely on CI for final enforcement.
