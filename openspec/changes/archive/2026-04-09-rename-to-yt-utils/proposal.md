## Why

The repository and extension are currently named "Mark As Seen", tied to a single feature. New utilities (starting with speed control) are planned, so the project needs a broader identity that doesn't constrain future development. The rename is a prerequisite before modularizing the codebase with a build tool.

## What Changes

- Rename the extension display name from "Mark As Seen" to "YT Utils"
- Replace all internal `mark-as-seen` prefixes with `yt-utils` (message types, DOM IDs, log prefixes, constants)
- Replace all `mark-as-seen-inline` prefixes with `yt-utils-inline` (content script button IDs, host IDs)
- Update the manifest `default_title` and `description` to reflect the new project name
- Update the README to reflect the new project identity
- **No structural or architectural changes** — only string replacements that preserve runtime behavior

## Capabilities

### New Capabilities

- `extension-naming`: Covers the naming contract for the extension — display name, internal prefixes for message types, DOM IDs, log prefixes, and constants.

### Modified Capabilities

- `youtube-watch-marking-extension`: The mark-as-seen automation flow remains behaviorally identical, but the extension name, internal identifiers, and user-facing strings change from "Mark As Seen" / `mark-as-seen` to "YT Utils" / `yt-utils`.
- `extension-repository-layout`: The README and manifest descriptions change to reflect the new project identity.

## Impact

- `extension/manifest.json` — name, description, default_title
- `extension/background.js` — message type constant, log prefixes, badge/title strings
- `extension/content.js` — message type constant, DOM IDs, log prefix, button labels
- `README.md` — project title, description, instructions
- `openspec/specs/` — existing specs reference "mark-as-seen" in descriptions and will need updated language
