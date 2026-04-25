# developer-quality-gates Specification (delta)

## MODIFIED Requirements

### Requirement: Prettier formatting and ESLint linting are enforced

The project SHALL use Prettier to format and ESLint with `typescript-eslint` to lint repository files relevant to the application and development workflow.

#### Scenario: Prettier formats project files

- **WHEN** a contributor runs `prettier --write` on the repository
- **THEN** files that do not match the configured style are rewritten into the expected format

#### Scenario: ESLint reports lint issues

- **WHEN** a contributor runs `eslint .` on the repository
- **THEN** files with rule violations are reported so they can be fixed before commit

### Requirement: Pre-commit hooks gate commits with quality checks

The project SHALL use a Git pre-commit hook managed by Husky to run formatting, linting, and TypeScript type checking before a commit completes.

#### Scenario: Commit is blocked by failing checks

- **WHEN** a contributor attempts to commit changes and either Prettier, ESLint, or type checking fails
- **THEN** the commit does not complete until the issues are resolved

#### Scenario: Commit succeeds when checks pass

- **WHEN** a contributor attempts to commit changes and Prettier, ESLint, and type checking all pass
- **THEN** the commit completes successfully
