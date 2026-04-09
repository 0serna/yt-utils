# extension-naming Specification

## Purpose
TBD - created by syncing change rename-to-yt-utils. Update Purpose after archive.

## Requirements

### Requirement: Extension uses a consistent internal naming convention
The extension SHALL use `yt-utils` as the hyphenated prefix for message types, DOM IDs, and other kebab-case identifiers. The extension SHALL use `YTUtils` as the PascalCase prefix for log output strings.

#### Scenario: Message type prefix
- **WHEN** the content script sends a trigger message to the background service worker
- **THEN** the message type value starts with `yt-utils:`

#### Scenario: DOM ID prefix
- **WHEN** the content script creates DOM elements for inline triggers
- **THEN** all element IDs start with `yt-utils-`

#### Scenario: Log prefix format
- **WHEN** the extension logs a message to the browser console
- **THEN** the prefix uses PascalCase `YTUtils` or `YTUtils:inline`

### Requirement: Extension has a human-readable display name
The extension SHALL present itself as "YT Utils" in the Chrome extension management UI and in the action tooltip.

#### Scenario: Manifest display name
- **WHEN** the extension manifest is loaded by Chrome
- **THEN** the `name` field is `"YT Utils"`

#### Scenario: Action tooltip on non-watch pages
- **WHEN** the user hovers over the extension action icon on a page that is not a supported YouTube watch page
- **THEN** the tooltip text reflects the broader "YT Utils" project name