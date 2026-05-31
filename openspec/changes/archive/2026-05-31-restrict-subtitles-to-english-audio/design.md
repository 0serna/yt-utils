## Context

The subtitle policy currently decides from the live YouTube player snapshot for the confirmed current video. Its selection model disables subtitles for Spanish audio, but enables English subtitles for any non-Spanish audio by preferring a direct English track and then falling back to English auto-translation.

The new desired behavior is narrower: subtitles are automatic only for confirmed English-audio videos. All other videos, including Spanish, other non-English languages, and unknown audio-language cases, should end with subtitles off unless the user manually changes them.

## Goals / Non-Goals

**Goals:**

- Restrict automatic subtitle activation to audio languages recognized as English variants.
- Select only direct English subtitle tracks for English-audio videos.
- Disable subtitles for non-English and unknown audio-language videos.
- Preserve current watch-video confirmation, stale-work protection, polling, and per-video manual override behavior.

**Non-Goals:**

- Add settings, UI, prompts, notifications, or user-configurable language rules.
- Change playback-speed behavior.
- Add a new language detection system.
- Use auto-translation as a fallback for this policy.

## Decisions

### Use positive English detection as the policy gate

The policy should enable subtitles only when `isEnglishLanguage(snapshot.audioLanguage)` is true. This treats `en`, `en-US`, `en_GB`, and other normalized English variants as eligible while making every other value ineligible.

Alternative considered: keep the previous non-Spanish gate and add exceptions. Rejected because the new rule is simpler and safer: only confirmed English audio can activate subtitles.

### Remove auto-translation from automatic activation

For eligible English audio, the policy should select a direct English subtitle track only. If no direct English track is available, the desired selection is off.

Alternative considered: use English auto-translation when direct English captions are missing. Rejected because it can produce indirect or surprising subtitle choices and does not match the requested strict behavior.

### Treat unknown audio language as off

When the player snapshot cannot provide a confirmed English audio language, the subtitle selection should be off even if caption tracks are present. Captions may still be used as selectable tracks after English audio is confirmed, but should not by themselves make a video eligible for subtitle activation.

Alternative considered: infer eligibility from available caption metadata. Rejected because it can activate subtitles on videos whose spoken language is not confirmed as English.

### Preserve per-video manual override semantics

The existing feature-level behavior that stops reapplying policy after a user changes subtitle or audio state for the current video should remain unchanged. New videos reached through SPA navigation should still get an independent policy evaluation.

Alternative considered: continuously enforce the rule. Rejected because it would fight user intent on the current video.

## Risks / Trade-offs

- [YouTube audio language metadata may be missing or wrong] → Prefer false negatives over unwanted subtitle activation; unknown language remains off.
- [Some English videos may only expose auto-generated or unusual English tracks] → Any direct track with an English language code remains eligible; translated tracks are not used.
- [Removing auto-translation reduces subtitle availability] → This is an intentional trade-off to make activation strict and predictable.
