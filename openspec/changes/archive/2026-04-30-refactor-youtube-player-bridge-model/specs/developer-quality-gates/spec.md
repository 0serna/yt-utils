## ADDED Requirements

### Requirement: Refactors SHALL reduce Fallow debt without suppressions

The project SHALL reduce targeted Fallow health findings through tested code simplification rather than inline suppressions, broad ignores, or weaker configured thresholds.

#### Scenario: Targeted refactor reduces findings

- **WHEN** a refactor targets functions reported by Fallow health
- **THEN** the resulting code reduces or eliminates those findings without adding `fallow-ignore` suppressions or raising configured health limits

#### Scenario: Remaining findings persist after focused refactor

- **WHEN** unrelated or unresolved Fallow health findings remain after the targeted refactor
- **THEN** those findings remain visible to the repository check command for future cleanup
