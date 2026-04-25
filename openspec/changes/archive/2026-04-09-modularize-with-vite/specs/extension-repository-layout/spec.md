## MODIFIED Requirements

### Requirement: Local setup documentation references the dedicated directory and build step

Contributor-facing setup documentation SHALL identify the dedicated extension directory as the path to use for unpacked loading, SHALL document the required build step before loading, and SHALL refer to the project by its current name "YT Utils".

#### Scenario: Documentation matches repository layout and build process

- **WHEN** a contributor follows the local loading instructions in the repository documentation
- **THEN** the instructions include running `npm install && npm run build` before loading the `extension/` directory, and the documentation refers to the project as "YT Utils"
