## ADDED Requirements

### Requirement: Repository test command

The project SHALL provide a test command that runs the TypeScript test suite with Vitest.

#### Scenario: Contributor runs tests

- **WHEN** a contributor runs `npm run test`
- **THEN** Vitest executes the repository test files and reports pass/fail results

### Requirement: DOM-capable test environment

The project SHALL run tests in an environment capable of exercising browser DOM APIs used by extension code.

#### Scenario: Test uses browser globals

- **WHEN** a test references `window`, `document`, `HTMLElement`, or DOM events
- **THEN** the test environment provides those APIs without requiring a real browser

### Requirement: Coverage is generated without threshold gating

The project SHALL generate Istanbul-compatible coverage data during the test command without failing solely because a coverage percentage is below a threshold.

#### Scenario: Test command completes with low coverage

- **WHEN** `npm run test` completes and repository coverage is below any arbitrary percentage
- **THEN** the command result is based on test pass/fail status rather than coverage percentage

#### Scenario: Coverage output is available

- **WHEN** `npm run test` completes successfully
- **THEN** Istanbul-compatible coverage output is available for tooling that can consume it

### Requirement: Initial characterization coverage

The project SHALL include initial characterization tests for shared YouTube player model behavior and MAIN-world YouTube player bridge behavior.

#### Scenario: Model behavior is characterized

- **WHEN** tests exercise shared YouTube player model helpers through their public exports
- **THEN** expected subtitle selection and signature behavior is verified without changing runtime behavior

#### Scenario: Bridge behavior is characterized

- **WHEN** tests exercise the MAIN-world bridge through observable DOM and message behavior
- **THEN** expected snapshot and subtitle-selection behavior is verified without exporting bridge internals
