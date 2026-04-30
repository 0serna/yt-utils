## MODIFIED Requirements

### Requirement: Fallow blocks real quality issues

The project SHALL run Fallow with failure behavior enabled as part of the unified check command, without broad source-wide suppression of duplicate-code analysis or health findings.

#### Scenario: Fallow reports real issues

- **WHEN** Fallow detects dead code, duplicate code, unresolved imports, or configured health violations after entry points are applied
- **THEN** the repository check command fails until the issues are resolved

#### Scenario: Fallow health violations are resolved

- **WHEN** the repository check command runs after the Fallow health debt reduction is complete
- **THEN** Fallow completes without health violations above the configured thresholds

### Requirement: Refactors SHALL reduce Fallow debt without suppressions

The project SHALL reduce targeted Fallow health findings through tested code simplification rather than inline suppressions, broad ignores, or weaker configured thresholds.

#### Scenario: Targeted refactor reduces findings

- **WHEN** a refactor targets functions reported by Fallow health
- **THEN** the resulting code reduces or eliminates those findings without adding `fallow-ignore` suppressions or raising configured health limits

#### Scenario: Remaining findings are resolved before completion

- **WHEN** the Fallow health debt reduction change is complete
- **THEN** the repository check command passes without unresolved Fallow health findings
