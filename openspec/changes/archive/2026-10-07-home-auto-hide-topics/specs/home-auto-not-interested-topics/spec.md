# Spec Delta

## REMOVED Requirements

### Requirement: Auto applies only on Home desktop

**Reason**: Superseded by `home-auto-hide-topics`, which owns Home-scope automatic handling via local hiding instead of the native action.
**Migration**: Use the `home-auto-hide-topics` Home-only requirement.

### Requirement: Topic registry with channels and keywords

**Reason**: Detection moves to `home-auto-hide-topics`; keeping requirements in two capabilities would double-maintain blocklists and risk divergence.
**Migration**: Use the `home-auto-hide-topics` topic registry and v1 seed requirements.

### Requirement: Serialized execution on dynamic feed

**Reason**: The serialized native-menu queue and the `No me interesa` click are removed; `home-auto-hide-topics` hides cards locally on the dynamic feed.
**Migration**: Use the `home-auto-hide-topics` local hiding and dynamic feed requirements.

### Requirement: Session dedup with bounded retries and silent errors

**Reason**: Local hiding is idempotent and has no menu, timeout, or retry failure modes; `videoId` dedup, the attempts limit, and `video-id.ts` are removed with this capability.
**Migration**: No replacement. Re-render protection is the reevaluation of hidden cards in `home-auto-hide-topics`.
