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

### Requirement: Background script barrel imports feature handlers
The `src/background.ts` barrel file SHALL import all feature background handlers and register their message listeners with `chrome.runtime.onMessage`.

#### Scenario: Background script includes all feature handlers
- **WHEN** the background service worker starts
- **THEN** all feature background handlers are imported and their message listeners are registered

### Requirement: Build command and npm scripts are documented
The `package.json` SHALL define `build`, `dev`, and `typecheck` scripts. The README SHALL document the build step as part of the local setup instructions.

#### Scenario: Contributor sets up the project
- **WHEN** a contributor clones the repository and follows the README setup instructions
- **THEN** they can run `npm install && npm run build` and load the resulting `extension/` directory in Chrome
