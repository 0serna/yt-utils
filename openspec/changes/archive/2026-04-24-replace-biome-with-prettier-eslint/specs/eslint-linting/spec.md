# eslint-linting Specification

## Purpose

Define the ESLint-based linting configuration for the repository, replacing the Biome linter.

## ADDED Requirements

### Requirement: ESLint lints TypeScript files

The project SHALL use ESLint with `typescript-eslint` to lint all TypeScript source files (`src/**/*.ts`, `vite.config.ts`). Root-level JSON files and the extension build output SHALL be excluded from linting.

#### Scenario: ESLint reports lint violations

- **WHEN** a contributor runs `eslint .` on the repository
- **THEN** files with rule violations are reported with error messages indicating the violated rule and location

#### Scenario: ESLint auto-fixes correctable violations

- **WHEN** a contributor runs `eslint --fix .` on the repository
- **THEN** auto-fixable rule violations are corrected in-place

### Requirement: ESLint uses TypeScript recommended rules

The project SHALL use the `typescript-eslint` `recommended` ruleset via ESLint flat config, providing baseline type-aware linting for TypeScript code.

#### Scenario: TypeScript-specific rules are enforced

- **WHEN** ESLint runs on the repository
- **THEN** TypeScript ESLint recommended rules are active (e.g., `no-unused-vars`, `no-explicit-any`, `prefer-const`)

### Requirement: ESLint and Prettier do not conflict

The project SHALL use `eslint-config-prettier` to disable ESLint rules that conflict with Prettier formatting. ESLint handles code quality; Prettier handles formatting.

#### Scenario: Formatting rules are left to Prettier

- **WHEN** ESLint runs on the repository
- **THEN** no ESLint violations are caused by formatting choices that Prettier would make (e.g., indentation, line width, quote style)
