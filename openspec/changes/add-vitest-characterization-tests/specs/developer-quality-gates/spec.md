## MODIFIED Requirements

### Requirement: Fallow blocks real quality issues

The project SHALL run Fallow with failure behavior enabled as part of the unified check command, without broad source-wide suppression of duplicate-code analysis or health findings.

#### Scenario: Fallow reports real issues

- **WHEN** Fallow detects dead code, duplicate code, unresolved imports, or configured health violations after entry points are applied
- **THEN** the repository check command fails until the issues are resolved

#### Scenario: Test coverage is introduced before Fallow health is fully resolved

- **WHEN** characterization tests are added while existing Fallow health violations remain
- **THEN** the repository check command continues to report and fail on those violations instead of suppressing them or weakening configured health thresholds
