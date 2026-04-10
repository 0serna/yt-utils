## 1. Update playback step behavior

- [x] 1.1 Change the playback-speed increment/decrement step from `0.1` to `0.05` in the feature implementation.
- [x] 1.2 Review any normalization, labels, or comparisons that assume a `0.1` step and keep them consistent with the new delta.

## 2. Verify behavior

- [x] 2.1 Run the relevant typecheck or feature tests for playback-speed behavior.
- [x] 2.2 Confirm the control still clamps at `0.5x` and `2.0x` and that persistence continues to work after the step change.
