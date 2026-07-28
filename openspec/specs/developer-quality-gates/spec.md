# developer-quality-gates Specification

## Purpose

Define repository quality gates that enforce formatting, linting, type checking, OpenSpec validation, and pre-commit hook behavior.

## Requirements

### Requirement: Prettier formatting and ESLint linting are enforced

The project SHALL use Prettier to format and ESLint with `typescript-eslint` to lint repository files relevant to the application and development workflow.

#### Scenario: Prettier formats project files

- **WHEN** a contributor runs `prettier --write` on the repository
- **THEN** files that do not match the configured style are rewritten into the expected format

#### Scenario: ESLint auto-fixes and reports remaining lint issues

- **WHEN** a contributor runs `npm run lint`
- **THEN** auto-fixable rule violations are corrected in-place and any remaining violations are reported

### Requirement: Quality gate commands run active checks

The project SHALL provide separate commands for ESLint, TypeScript, and OpenSpec validation.

#### Scenario: Repository validation commands run active gates

- **WHEN** a contributor runs `npm run lint`, `npm run typecheck`, and `npm run validate`
- **THEN** ESLint, TypeScript, and OpenSpec validation run and report failures directly

### Requirement: Pre-commit hooks auto-format and auto-fix staged files

The project SHALL use a Git pre-commit hook managed by Husky to run `lint-staged`, which applies Prettier formatting and ESLint auto-fixes to staged files and re-stages the results.

#### Scenario: Staged files are formatted and auto-fixed before commit

- **WHEN** a contributor attempts to commit changes
- **THEN** `lint-staged` runs Prettier and `eslint --fix` on staged matching files and re-stages any changes

#### Scenario: Commit is blocked by failing auto-fix

- **WHEN** a contributor attempts to commit changes and `lint-staged` cannot format or auto-fix staged files
- **THEN** the commit does not complete until the issues are resolved

#### Scenario: Commit proceeds after the hook succeeds

- **WHEN** a contributor attempts to commit changes and `lint-staged` completes without errors
- **THEN** the commit continues

### Requirement: Hook setup is reproducible after install

The project SHALL make the Husky hook setup available from the repository so contributors can enable the same pre-commit behavior after installing dependencies.

#### Scenario: Fresh clone can enable hooks

- **WHEN** a contributor installs project dependencies in a fresh clone
- **THEN** the repository provides the hook setup needed to activate the pre-commit checks locally

### Requirement: Refactors SHALL preserve quality gates without suppressions

The project SHALL reduce targeted quality findings through tested code simplification rather than inline suppressions, broad ignores, or weaker configured thresholds. When the same structural logic is duplicated across production modules, the project SHALL prefer a shared reusable abstraction or equivalent code simplification over leaving the duplication in place.

#### Scenario: Targeted refactor reduces quality findings

- **WHEN** a refactor targets functions reported by active quality gates
- **THEN** the resulting code reduces or eliminates those findings without adding suppressions or weakening configured limits

#### Scenario: Shared duplication is simplified without weakening gates

- **WHEN** duplicated production logic is refactored into a shared helper or an equivalent simpler structure
- **THEN** `npm run lint`, `npm run typecheck`, and `npm run validate` pass without adding broad ignore rules for those files
