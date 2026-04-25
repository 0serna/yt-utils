## Why

The current subtitle policy applies different behaviors based on inferred audio language and can automatically enable direct or translated English subtitles on initial watch-page load. The desired behavior is simpler and more predictable: every supported YouTube watch page should start with subtitles off unless the user manually enables them for that video.

## What Changes

- Change the watch-page subtitle policy to always disable subtitles on initial video load, regardless of inferred audio language.
- Remove automatic selection of direct English subtitle tracks and English auto-translation during automatic policy application.
- Preserve the existing per-video manual override behavior so a user can re-enable subtitles for the current video without the extension turning them back off again.
- Keep the subtitle policy silent, with no new user-facing controls or prompts.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `audio-language-subtitle-policy`: replace language-based automatic subtitle selection with a universal default-off policy on watch-page activation while continuing to respect manual per-video overrides.

## Impact

- Affected specs: `openspec/specs/audio-language-subtitle-policy/spec.md`
- Affected code: `src/features/audio-language-subtitle-policy/content.ts`, `src/shared/youtube-player.ts`, `src/main-world/youtube-player-bridge.ts`
- Affected behavior: supported YouTube watch pages will no longer auto-enable direct English captions or English auto-translation for any audio language.
