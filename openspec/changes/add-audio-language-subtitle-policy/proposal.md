## Why

The extension already automates YouTube watch-page behavior, but subtitle handling is still manual even when the desired outcome is consistent: Spanish-audio videos should play without subtitles, while non-Spanish videos should prefer English subtitles. Adding a silent subtitle policy now fits the project's existing watch-page automation model and removes repetitive per-video setup.

## What Changes

- Add a new watch-page feature that inspects the active YouTube player audio language and applies a subtitle policy automatically.
- Disable subtitles when the active audio track is Spanish.
- For non-Spanish audio, enable subtitles and prefer a direct English track first, then fall back to auto-translated English when available.
- Turn subtitles off when English cannot be selected.
- Respect manual user overrides for the current video after the extension applies its initial policy.
- Keep the behavior silent, with no new visible UI or prompts.

## Capabilities

### New Capabilities
- `audio-language-subtitle-policy`: Automatically manage YouTube subtitles based on the active audio language, with English direct and auto-translate fallback rules.

### Modified Capabilities

## Impact

- Affected code: `src/content.ts`, a new `src/features/<name>/` module, and likely shared helpers for accessing the live YouTube player state.
- Affected systems: watch-page feature activation, Chrome scripting execution in the page's main world, and YouTube player subtitle/audio APIs.
- No external service dependencies or user-facing configuration changes are expected in the initial version.
