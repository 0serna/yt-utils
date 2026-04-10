## Context

The extension already implements playback speed as an inline watch-page feature with persisted state and direct `HTMLVideoElement.playbackRate` updates. The current step size is `0.1`, which is functional but a little coarse for small user adjustments.

## Goals / Non-Goals

**Goals:**
- Reduce playback-speed adjustments to `0.05` per click.
- Keep the existing control, bounds, default speed, and persistence behavior unchanged.
- Preserve the current desktop watch-page-only scope.

**Non-Goals:**
- Changing the control layout or styling.
- Introducing keyboard shortcuts, new UI surfaces, or new storage behavior.
- Modifying the lower or upper bounds.

## Decisions

### Keep the control model unchanged and adjust only the step constant
The implementation should continue using the existing inline decrement/value/increment control and the same playback-rate application flow. Only the increment/decrement delta changes from `0.1` to `0.05`.

This keeps the change low-risk and avoids touching unrelated watch-page lifecycle logic.

Alternative considered: refactoring the control to accept arbitrary step sizes or presets. Rejected because it adds complexity without solving the current request.

### Preserve the current clamping and display behavior
The same min/max bounds and one-decimal formatted display should remain in place. The smaller step does not require new bounds or a new rendering model.

This avoids regressions in persistence and keeps the visible speed state stable.

Alternative considered: increasing display precision to two decimals. Rejected because the control already normalizes and renders a simple `x` value, and the user request only asks for a finer step.

## Risks / Trade-offs

- [More clicks may be needed to move across the same speed range] -> Acceptable trade-off because the goal is finer control, not fewer interactions.
- [Floating-point drift becomes more visible with smaller steps] -> Continue normalizing values before comparing, saving, and rendering.
- [Spec and implementation can diverge on the new step size] -> Update the playback-speed spec and keep tests focused on the exact `0.05` delta.

## Migration Plan

1. Update the playback-speed step constant from `0.1` to `0.05`.
2. Update the corresponding spec to reflect the new interaction step.
3. Verify that bounds, labels, and persistence still behave as before.

Rollback is trivial: restore the previous step constant and spec text.

## Open Questions

None.
