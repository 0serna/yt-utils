## ADDED Requirements

### Requirement: Fallow analyzes extension entry points

The project SHALL configure Fallow with the Chrome extension runtime entry points used by the manifest so reachable extension modules are not reported as unused files.

#### Scenario: Fallow runs with extension roots

- **WHEN** a contributor runs the repository check command
- **THEN** Fallow analyzes `src/background.ts`, `src/content.ts`, `src/global-selection.ts`, and `src/main-world/youtube-player-bridge.ts` as runtime entry points

### Requirement: Fallow blocks real quality issues

The project SHALL run Fallow with failure behavior enabled as part of the unified check command, without broad source-wide suppression of duplicate-code analysis.

#### Scenario: Fallow reports real issues

- **WHEN** Fallow detects dead code, duplicate code, unresolved imports, or configured health violations after entry points are applied
- **THEN** the repository check command fails until the issues are resolved

### Requirement: Fallow health limits are explicit

The project SHALL define explicit Fallow health thresholds so complexity failures are based on project-approved limits rather than implicit defaults.

#### Scenario: Health threshold is exceeded

- **WHEN** analyzed code exceeds a configured Fallow health threshold
- **THEN** the repository check command reports the violation and fails
