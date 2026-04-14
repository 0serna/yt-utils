## 1. Shared language and speed foundations

- [x] 1.1 Remove playback-speed persistence reads and writes so watch pages no longer load or save a global default.
- [x] 1.2 Align the playback-speed feature with the live player snapshot language inference used by subtitle policy, including any duplicated helper logic that must stay in sync.

## 2. Playback-speed behavior updates

- [x] 2.1 Initialize each supported watch page at `1.00x` and adjust to `0.90x` only for videos whose inferred audio language is English.
- [x] 2.2 Preserve manual playback-speed changes only for the current video and reset the language-based initialization path on the next watch-page navigation.

## 3. Subtitle policy updates and verification

- [x] 3.1 Update subtitle selection so English and Spanish audio both leave subtitles off, while other languages still prefer direct English subtitles and then English auto-translation.
- [x] 3.2 Verify the updated behavior on representative English, Spanish, non-English, and unknown-language watch pages, confirming that subtitles stay off for unknown language and that playback speed no longer carries across videos.
