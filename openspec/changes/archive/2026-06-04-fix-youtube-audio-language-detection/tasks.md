## 1. Audio Language Model Updates

- [x] 1.1 Extend the shared `AudioTrack` type to include the observed current YouTube audio metadata shape used by `getAudioTrack()`.
- [x] 1.2 Update MAIN-world bridge audio-language inference to read active audio metadata from existing and current YouTube shapes.
- [x] 1.3 Remove caption-track order as a fallback source for inferring active audio language.

## 2. Behavior Coverage

- [x] 2.1 Add or update bridge snapshot tests for English and Spanish audio metadata exposed through the current YouTube metadata shape.
- [x] 2.2 Add or update player-model/playback-speed coverage proving caption metadata alone does not infer active audio language.
- [x] 2.3 Add or update subtitle-policy coverage for English audio with direct English captions after corrected active audio inference.

## 3. Validation

- [x] 3.1 Run focused tests for the bridge, subtitle policy, player model, and playback speed.
- [x] 3.2 Run the repository check command.
- [x] 3.3 Build the extension and manually validate representative YouTube watch pages opened in new tabs and through SPA navigation.
