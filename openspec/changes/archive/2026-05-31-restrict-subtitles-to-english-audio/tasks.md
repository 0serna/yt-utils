## 1. Subtitle Selection Policy

- [x] 1.1 Update subtitle selection so only confirmed English audio can select a direct English subtitle track.
- [x] 1.2 Remove automatic English auto-translation fallback from subtitle selection.
- [x] 1.3 Ensure non-English and unknown audio-language snapshots resolve to subtitles off.

## 2. Tests and Verification

- [x] 2.1 Update shared player-model tests for English-audio activation, non-English off behavior, unknown off behavior, and removed auto-translation fallback.
- [x] 2.2 Update subtitle-policy feature tests that assume non-English audio can activate subtitles.
- [x] 2.3 Run focused tests for the subtitle policy and shared player model.
- [x] 2.4 Run the project check command.
