# project-structure Specification

## Purpose

Define the feature-based `src/` project structure and shared code layout used by the extension.

## Requirements

### Requirement: Source files live under src/ with feature-based layout

The project SHALL organize source code under `src/` with a `features/<name>/` subdirectory per feature and a `shared/` directory for cross-feature utilities.

#### Scenario: Feature module placement

- **WHEN** a contributor adds a new feature called "speed-control"
- **THEN** the feature's content script, background handler, and types live under `src/features/speed-control/`

#### Scenario: Shared utility placement

- **WHEN** two or more features need a common YouTube DOM helper
- **THEN** that helper lives in `src/shared/youtube-dom.ts` and is imported by both features

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

### Requirement: Background script barrel imports feature handlers

The `src/background.ts` barrel file SHALL import all feature background handlers and register their message listeners with `chrome.runtime.onMessage`.

#### Scenario: Background script includes all feature handlers

- **WHEN** the background service worker starts
- **THEN** all feature background handlers are imported and their message listeners are registered

### Requirement: Build and validation scripts are documented

The `package.json` SHALL define `build` and `check` scripts. The README SHALL document the build step as part of the local setup instructions and the validation command for contributors.

#### Scenario: Contributor sets up the project

- **WHEN** a contributor clones the repository and follows the README setup instructions
- **THEN** they can run `npm install && npm run build` and load the resulting `extension/` directory in Chrome
