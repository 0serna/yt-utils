## Context

Several content scripts follow the same reactive DOM pattern: start polling, observe relevant YouTube DOM mutations, coalesce work with `requestAnimationFrame`, guard against stale activations, and avoid concurrent sync work. Separately, watch-page controls duplicate insertion logic around YouTube's action row and Like button.

These patterns are cross-feature mechanics, not feature-specific behavior. They belong in shared utilities once more than one feature needs them.

## Goals / Non-Goals

**Goals:**

- Reduce duplicate DOM synchronization code across feature content scripts.
- Reduce duplicate watch action insertion code across injected controls.
- Preserve current feature activation/deactivation semantics and user-visible behavior.
- Keep shared helpers small and explicit.

**Non-Goals:**

- Creating a new feature framework or replacing `FeatureRegistry`.
- Changing which pages features activate on.
- Changing button appearance, labels, or feature behavior beyond equivalent DOM placement/sync.

## Decisions

- Introduce a minimal DOM sync controller for content scripts that need polling plus mutation-triggered sync. The controller should own timer setup, observer setup, animation-frame queueing, token invalidation, and in-flight protection while delegating feature-specific filtering and sync behavior to callbacks.
- Keep page support checks and feature-specific state inside each feature. The shared controller should orchestrate sync timing, not know YouTube feature rules.
- Introduce watch action insertion helpers that identify the action row insertion target and handle host placement while allowing callers to pass excluded host IDs.
- Update ask auto-open and engagement panel scroll containment to share the sync controller. Update mark-as-seen and playback-speed to share watch action insertion logic.

## Risks / Trade-offs

- Shared timing behavior can subtly alter race conditions on YouTube's dynamic DOM. → Preserve existing intervals, mutation filters, and requestAnimationFrame coalescing semantics during extraction.
- A too-generic controller could obscure feature logic. → Keep the controller callback-based and limited to repeated lifecycle mechanics.
- YouTube DOM changes are hard to test with static checks. → Validate with `npm run check`, `npm run build`, and manual YouTube watch-page checks.
