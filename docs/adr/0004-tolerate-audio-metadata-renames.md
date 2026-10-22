# Read audio metadata by shape when YouTube renames its minified keys

`readAudioTrackMetadata` checks the known minified keys first, then scans own values for a track-like shape (an object with a non-empty string `id` or `name`). Caption keys and flags are excluded. YouTube renamed the key to `wM` without notice and Spanish audio became unknown, which turned on English subtitles.

**Consequences**: a future non-audio key with the same shape could be read as metadata. The exclusion list and the known-key precedence limit that risk. A real unknown track (`und` with no usable name) still counts as unknown.
