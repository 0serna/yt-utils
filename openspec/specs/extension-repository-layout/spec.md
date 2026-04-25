# extension-repository-layout Specification

## Purpose

Define the repository layout that keeps the unpacked Chrome extension in a dedicated loadable directory.

## Requirements

### Requirement: Extension files live in a dedicated loadable directory

The repository SHALL keep the unpacked Chrome extension runtime files in a dedicated subdirectory that can be selected directly when loading the extension in the browser.

#### Scenario: Loading the unpacked extension

- **WHEN** a contributor uses Chrome's `Load unpacked` flow
- **THEN** they can choose the dedicated extension directory without selecting the repository root

### Requirement: Existing extension behavior remains available after relocation

Moving the extension files into the dedicated directory SHALL preserve the existing mark-as-seen browser action behavior and all manifest-declared runtime entrypoints.

#### Scenario: Browser action still runs after the move

- **WHEN** the extension is loaded from the dedicated directory and the user clicks the action on a supported YouTube watch page
- **THEN** the extension starts the same mark-as-seen automation flow as before the repository layout change

### Requirement: Local setup documentation references the dedicated directory and build step

Contributor-facing setup documentation SHALL identify the dedicated extension directory as the path to use for unpacked loading, SHALL document the required build step before loading, and SHALL refer to the project by its current name "YT Utils".

#### Scenario: Documentation matches repository layout and build process

- **WHEN** a contributor follows the local loading instructions in the repository documentation
- **THEN** the instructions include running `npm install && npm run build` before loading the `extension/` directory, and the documentation refers to the project as "YT Utils"
