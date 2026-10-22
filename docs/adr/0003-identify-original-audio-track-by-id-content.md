# Identify the Original Audio Track from its id content, not its flags

Selection order is: track content encoded in the id (`original` or `dubbed`, base64 after the last `;`), then a name that marks the track as original, then `isAutoDubbed: false` excluding tracks marked `dubbed`, then `isDefault: true`. On a real multi-audio video every track reported `isAutoDubbed: false` and the active dubbed track reported `isDefault: true`, so the flags alone kept the dubbed track.

**Considered options**: adding a `content` field to `AvailableAudioTrack` was rejected because the value is already in the id and the extra field would force every fixture to change.
