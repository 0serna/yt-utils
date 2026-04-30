## 1. Shared DOM Sync Controller

- [x] 1.1 Add a minimal shared DOM sync controller for polling, mutation observation, animation-frame queueing, token invalidation, and in-flight sync guarding
- [x] 1.2 Refactor ask auto-open to use the shared DOM sync controller without changing existing timing constants or feature state rules
- [x] 1.3 Refactor engagement panel scroll containment to use the shared DOM sync controller without changing existing panel filtering or containment behavior

## 2. Shared Watch Action Insertion

- [x] 2.1 Add shared helper logic for finding and placing hosts in the YouTube watch action row with caller-provided excluded IDs
- [x] 2.2 Refactor mark-as-seen inline button insertion to use the shared watch action helper
- [x] 2.3 Refactor playback speed control insertion to use the shared watch action helper

## 3. Verification

- [x] 3.1 Run `npm run check` and confirm the targeted DOM duplicate groups are removed or reduced as expected
- [x] 3.2 Run `npm run build`
- [x] 3.3 Manually validate affected YouTube watch-page behaviors: ask auto-open, engagement panel containment, mark-as-seen button placement, and playback speed control placement
- [x] 3.4 Run `openspec validate reduce-feature-dom-duplication --strict`
