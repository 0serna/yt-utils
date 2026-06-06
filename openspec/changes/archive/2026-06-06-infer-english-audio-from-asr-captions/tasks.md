## 1. Policy Logic

- [x] 1.1 Add a helper in `src/shared/youtube-player-model.ts` that detects direct English auto-generated caption tracks using English language plus ASR metadata.
- [x] 1.2 Update `determineSubtitleSelection` so unknown active audio with a direct English auto-generated caption track is treated as English-audio content.
- [x] 1.3 Ensure explicit non-English `audioLanguage` still returns subtitle mode `off`, even when English auto-generated captions exist.

## 2. Tests

- [x] 2.1 Add unit coverage for unknown audio plus English ASR captions selecting the English track.
- [x] 2.2 Add unit coverage for unknown audio plus manual English captions staying off.
- [x] 2.3 Add unit coverage for explicit non-English audio plus English ASR captions staying off.

## 3. Validation

- [x] 3.1 Run the focused Vitest suite for YouTube player model behavior.
- [x] 3.2 Run the configured repository check command.
