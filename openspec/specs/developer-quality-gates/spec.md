# developer-quality-gates Specification

## Purpose

Define repository quality gates that enforce formatting, linting, type checking, OpenSpec validation, and pre-commit hook behavior.

## Requirements

### Requirement: Prettier formatting and ESLint linting are enforced

The project SHALL use Prettier to format and ESLint with `typescript-eslint` to lint repository files relevant to the application and development workflow.

#### Scenario: Prettier formats project files

- **WHEN** a contributor runs `prettier --write` on the repository
- **THEN** files that do not match the configured style are rewritten into the expected format

#### Scenario: ESLint reports lint issues

- **WHEN** a contributor runs `eslint .` on the repository
- **THEN** files with rule violations are reported so they can be fixed before commit

### Requirement: Unified check command runs active quality gates

The project SHALL provide a unified check command that runs ESLint, TypeScript, and OpenSpec validation without running removed tooling.

#### Scenario: Repository check runs active gates

- **WHEN** a contributor runs the repository check command
- **THEN** ESLint, TypeScript, and OpenSpec validation run and report failures through the check summary

### Requirement: Pre-commit hooks gate commits with quality checks

The project SHALL use a Git pre-commit hook managed by Husky to run formatting, linting, and TypeScript type checking before a commit completes.

#### Scenario: Commit is blocked by failing checks

- **WHEN** a contributor attempts to commit changes and either Prettier, ESLint, or type checking fails
- **THEN** the commit does not complete until the issues are resolved

#### Scenario: Commit succeeds when checks pass

- **WHEN** a contributor attempts to commit changes and Prettier, ESLint, and type checking all pass
- **THEN** the commit completes successfully

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
- **THEN** the repository check command passes without adding broad ignore rules for those files
