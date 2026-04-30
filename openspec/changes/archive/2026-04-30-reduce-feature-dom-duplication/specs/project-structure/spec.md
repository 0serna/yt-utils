## ADDED Requirements

### Requirement: Cross-feature DOM orchestration lives in shared utilities

The project SHALL place repeated DOM synchronization mechanics used by multiple feature content scripts in shared utilities rather than duplicating polling, mutation observation, animation-frame queueing, and in-flight guards in each feature.

#### Scenario: Multiple features need DOM synchronization

- **WHEN** two or more feature content scripts need the same polling and mutation-triggered synchronization mechanics
- **THEN** those mechanics are implemented in a shared utility and imported by the features

### Requirement: Watch action insertion logic is shared

The project SHALL place repeated YouTube watch action row insertion logic in shared utilities when multiple controls inject hosts into the same action area.

#### Scenario: Multiple controls use the watch action row

- **WHEN** multiple feature controls insert host elements into the YouTube watch action row
- **THEN** target selection and host placement logic are shared rather than duplicated per feature
