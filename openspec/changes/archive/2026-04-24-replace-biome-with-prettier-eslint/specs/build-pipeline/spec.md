# build-pipeline Specification (delta)

## MODIFIED Requirements

### Requirement: Validation passes with Prettier, ESLint, and TypeScript

The project SHALL use TypeScript with `strict: true` in `tsconfig.json`. All source files in `src/` SHALL pass the repository validation command without errors.

#### Scenario: Validation passes

- **WHEN** a contributor runs `npm run check`
- **THEN** Prettier reports no formatting issues, ESLint reports no lint issues, and the TypeScript compiler reports no type errors across all source files in `src/`
