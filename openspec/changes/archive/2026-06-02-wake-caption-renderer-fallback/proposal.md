## Why

The audio-language subtitle policy can select the correct English caption track while YouTube still fails to render visible caption text. Users experience this as subtitles not activating even though the player reports `subtitlesOn=true` and the English track is selected.

## What Changes

- Treat logical caption selection as insufficient when the caption renderer appears dormant.
- Add a one-time UI-based fallback that refreshes the YouTube captions control when the desired track is logically selected but no caption text appears after a short grace period.
- Preserve the existing language policy: enable English captions for English audio and keep captions off for non-English or unknown audio.
- Preserve user override behavior; if the user changes caption state during verification, the feature must not fight the user.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `audio-language-subtitle-policy`: Require the policy to attempt a one-time captions renderer wake-up when English captions are logically active but not rendering after a short delay.

## Impact

- Affects the YouTube content-script subtitle policy feature.
- Affects the MAIN-world YouTube player bridge or related content helpers if UI fallback behavior needs browser-side access.
- Affects tests for subtitle selection verification, fallback timing, and user override handling.
- No new external dependencies or extension APIs are expected.
