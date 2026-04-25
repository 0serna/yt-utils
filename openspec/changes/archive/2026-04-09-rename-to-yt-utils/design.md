## Context

The project is a Chrome extension currently named "Mark As Seen" that automates marking YouTube videos as watched. All internal identifiers — message types, DOM IDs, log prefixes, manifest fields — use the `mark-as-seen` prefix. The project is about to grow with new features (speed control being next), so the name needs to reflect a broader "YouTube utilities" scope before the modularization change introduces a build step and TypeScript.

The rename is purely cosmetic and contractual: no logic changes, no architectural shifts. It's a prerequisite so that the subsequent modularization change works with the correct naming from day one.

Current naming surface area:

- `manifest.json`: `name`, `description`, `default_title`
- `background.js`: message type `"mark-as-seen:inline-trigger"`, log prefix `[mark-as-seen]`, badge/title strings
- `content.js`: message type `"mark-as-seen:inline-trigger"`, DOM IDs `mark-as-seen-inline-host` / `mark-as-seen-inline-button`, log prefix `[mark-as-seen-inline]`
- `README.md`: title, description, usage instructions

## Goals / Non-Goals

**Goals:**

- Replace all `mark-as-seen` identifiers with `yt-utils` equivalents
- Replace user-facing strings ("Mark As Seen") with "YT Utils"
- Preserve all runtime behavior — the extension must work identically after rename
- Produce a clean baseline for the modularization change

**Non-Goals:**

- Structural or architectural changes (those belong in the modularization change)
- Adding TypeScript or a build step
- Adding new features or capabilities
- Changing the git remote or repository name on GitHub

## Decisions

### 1. Prefix: `yt-utils` for message types and DOM IDs, `YTUtils` for log prefixes

- Message types: `yt-utils:inline-trigger` (hyphenated, matches Chrome extension convention)
- DOM IDs: `yt-utils-inline-host`, `yt-utils-inline-button` (hyphenated, matches HTML convention)
- Log prefixes: `[YTUtils]`, `[YTUtils:inline]` (PascalCase, matches console convention)
- Manifest name: `"YT Utils"` (human-readable with space)
- Manifest description: updated to reflect broader scope

**Why not `YTUtils` everywhere?** DOM IDs and message types use kebab-case by web convention. Log prefixes use PascalCase for readability in console output.

### 2. Constant naming in code: camelCase

The constant `INLINE_TRIGGER_MESSAGE` was `"mark-as-seen:inline-trigger"`. Its new value will be `"yt-utils:inline-trigger"`. The constant name itself stays camelCase; only the string value changes. Same pattern for `BUTTON_HOST_ID` and `BUTTON_ID`.

### 3. README rewrite scope

The README will shift from describing a single-feature extension to describing the project as "a set of YouTube utilities delivered as a Chrome extension." It will still document the mark-as-seen feature as the current capability. This positions the README correctly for future features without pre-writing documentation for features that don't exist yet.

### 4. Badge text unchanged

The `"OK"` and `"ERR"` badge text on the extension action are generic status indicators — they don't reference the old name and don't need changing.

## Risks / Trade-offs

- **[Selectors break if other extensions / scripts reference the old DOM IDs]** → Mitigation: This is a personal-use extension with no known external consumers. Accept the risk.
- **[OpenSpec specs reference "mark-as-seen" in descriptions]** → Mitigation: The specs change in this change updates the language. The spec file names (`youtube-watch-marking-extension`, `extension-repository-layout`) remain unchanged since they describe capabilities, not the project name.
