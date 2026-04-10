## Why

The current playback-speed control is already useful, but the `0.1` step makes small adjustments feel coarse when users want to nudge speed more precisely. Reducing the step to `0.05` keeps the same interaction model while making the control finer-grained.

## What Changes

- Reduce the playback-speed increment and decrement step from `0.1` to `0.05`.
- Keep the existing inline control, default speed, and bounds unchanged.
- Preserve the current persistence and watch-page behavior.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `youtube-watch-marking-extension`: refine the existing inline playback-speed control so it adjusts in smaller `0.05` steps.

## Impact

- Affects the playback-speed feature implementation and its corresponding spec.
- No new UI surfaces, storage keys, or YouTube page targets are introduced.
