# prettier-formatting Specification

## Purpose

Define the Prettier-based code formatting configuration for the repository, replacing the Biome formatter.

## Requirements

### Requirement: Prettier formats TypeScript and JSON files

The project SHALL use Prettier to format all TypeScript source files (`src/**/*.ts`, `vite.config.ts`), root-level JSON files (`package.json`, `tsconfig.json`), and OpenSpec JSON files (`openspec/**/*.json`). The extension build output (`extension/manifest.json`) SHALL be excluded from formatting.

#### Scenario: Prettier rewrites misformatted files

- **WHEN** a contributor runs `prettier --write` on the repository
- **THEN** files that do not match the configured style are rewritten into the expected format

#### Scenario: Prettier reports formatting issues in check mode

- **WHEN** a contributor runs `prettier --check` on the repository
- **THEN** files with formatting deviations are reported as errors without modifying them

### Requirement: Prettier configuration matches existing style

The project SHALL configure Prettier with double quotes (`singleQuote: false`), matching the existing Biome double-quote style, to minimize formatting diff during migration. JSON files SHALL use the `json` parser.

#### Scenario: TypeScript files use double quotes

- **WHEN** Prettier formats a TypeScript file
- **THEN** string literals use double quotes, consistent with the existing codebase style
