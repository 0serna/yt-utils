## Why

YouTube's subscriptions feed displays 3 videos per row on many desktop resolutions, leaving significant unused horizontal space. Users with wider monitors want to see more content at once without excessive scrolling. This feature adds a grid density option to show 4 videos per row, maximizing screen real estate usage.

## What Changes

- Add new feature `subscriptions-grid-density` to the extension
- Inject CSS to override video card widths on the subscriptions feed
- Reduce video card width from ~528px to ~400px to fit 4 cards per row
- Maintain proper thumbnail aspect ratios (16:9) at the reduced size
- Follow existing feature patterns in the codebase (activation/deactivation lifecycle)

## Capabilities

### New Capabilities

- `subscriptions-grid-density`: Controls the grid layout density on YouTube's subscriptions feed page, allowing users to view 4 videos per row instead of the default 3.

### Modified Capabilities

- None (this is a purely additive change with no breaking changes to existing functionality)

## Impact

- **Code**: New feature module at `src/features/subscriptions-grid-density/content.ts`
- **Registration**: Added to feature registry in `src/content.ts`
- **Page Scope**: Only affects `www.youtube.com/feed/subscriptions` desktop page
- **Dependencies**: No new external dependencies; uses existing extension infrastructure
- **Performance**: Minimal impact - single CSS injection on page load/navigation
