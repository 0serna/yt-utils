# extension-repository-layout Specification

## Purpose
TBD - created by syncing change group-extension-files-under-directory.

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

### Requirement: Local setup documentation references the dedicated directory
Contributor-facing setup documentation SHALL identify the dedicated extension directory as the path to use for unpacked loading.

#### Scenario: Documentation matches repository layout
- **WHEN** a contributor follows the local loading instructions in the repository documentation
- **THEN** the documented path points to the dedicated extension directory that contains the manifest file
