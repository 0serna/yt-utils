## Why

Watched-video dimming currently only runs on the subscriptions feed, so watched videos on channel video tabs, search results, home, playlists, and watch-page recommendations remain visually indistinguishable from unwatched videos except for YouTube's small progress bar. Expanding the feature makes the seen-state cue consistent across desktop YouTube browsing surfaces.

## What Changes

- Extend seen-card dimming from only `/feed/subscriptions` to all desktop `www.youtube.com` surfaces that render video list cards with YouTube's native watched-progress indicator.
- Change the watched threshold from 80% to 90% progress.
- Continue dimming only `yt-lockup-view-model` card wrappers, leaving unsupported card structures unchanged.
- Continue excluding Shorts from dimming everywhere.
- Track extension-applied dimming with an extension-owned marker so deactivation only restores elements dimmed by this feature.
- Exclude mobile YouTube and embedded players.

## Capabilities

### New Capabilities

### Modified Capabilities

- `seen-card-dimming`: Expand eligible surfaces beyond subscriptions, update the watched threshold to 90%, preserve Shorts exclusion globally, and require ownership tracking for dimming cleanup.

## Impact

- Affects `src/features/seen-card-dimming/content.ts` page matching, card discovery, watched-progress threshold, Shorts detection, and dimming cleanup.
- May affect shared YouTube DOM helpers in `src/shared/youtube-dom.ts` if generic desktop YouTube page or card helpers are introduced.
- Requires spec coverage for broad desktop YouTube surfaces, unsupported card structures, and owned cleanup behavior.
