## MODIFIED Requirements

### Requirement: Fallow blocks real quality issues

The project SHALL run Fallow with failure behavior enabled as part of the unified check command, without broad source-wide suppression of duplicate-code analysis or health findings.
Known duplicate-code or configured health violations in production extension code SHALL be resolved before the repository check is considered green.

#### Scenario: Fallow reports real issues

- **WHEN** Fallow detects dead code, duplicate code, unresolved imports, or configured health violations after entry points are applied
- **THEN** the repository check command fails until the issues are resolved

#### Scenario: Fallow health violations are resolved

- **WHEN** the repository check command runs after the Fallow health debt reduction is complete
- **THEN** Fallow completes without health violations above the configured thresholds

#### Scenario: Duplicate-code findings are resolved

- **WHEN** the repository check command runs after the duplicate-code refactor work is complete
- **THEN** Fallow completes without unresolved duplicate-code findings in production extension source

### Requirement: Refactors SHALL reduce Fallow debt without suppressions

The project SHALL reduce targeted Fallow health findings through tested code simplification rather than inline suppressions, broad ignores, or weaker configured thresholds.
When the same structural logic is duplicated across production modules, the project SHALL prefer a shared reusable abstraction or equivalent code simplification over leaving the duplication in place.

#### Scenario: Targeted refactor reduces findings

- **WHEN** a refactor targets functions reported by Fallow health
- **THEN** the resulting code reduces or eliminates those findings without adding `fallow-ignore` suppressions or raising configured health limits

#### Scenario: Remaining findings are resolved before completion

- **WHEN** the Fallow health debt reduction change is complete
- **THEN** the repository check command passes without unresolved Fallow health findings

#### Scenario: Shared duplication is simplified without weakening the gate

- **WHEN** duplicated production logic is refactored into a shared helper or an equivalent simpler structure
- **THEN** the repository check command passes without adding broad Fallow ignore rules for those files
