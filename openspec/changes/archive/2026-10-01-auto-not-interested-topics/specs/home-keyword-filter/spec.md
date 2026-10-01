# Spec Delta

## REMOVED Requirements

### Requirement: Filtro aplica solo en Home desktop

**Reason**: Superseded by `home-auto-not-interested-topics`, which owns Home-scope automatic handling via the native action instead of local hiding.
**Migration**: Use `home-auto-not-interested-topics` scope requirement for Home-only behavior.

### Requirement: Match por título, canal y handle normalizados

**Reason**: Detection moves to the per-topic channel+keyword registry in `home-auto-not-interested-topics`; keeping a parallel matcher would double-maintain blocklists and risk divergence.
**Migration**: Use `home-auto-not-interested-topics` topic registry requirement.

### Requirement: Lista inicial Clash Royale con núcleo y jerga

**Reason**: The v1 seed (core, variants, observed channels, jargon) moves into the `clash-royale` topic of `home-auto-not-interested-topics`, extended with observed channels and `electro wizard` / `mago electrico` / `troop` / `equipment` jargon.
**Migration**: Use the `clash-royale` seed in `home-auto-not-interested-topics`.

### Requirement: Feed dinámico y restauración reversible

**Reason**: Local `display:none` hiding and restore-on-deactivate are removed; there is no local hidden state to restore once the native action owns the visual effect, and failed cards stay visible by design.
**Migration**: Use `home-auto-not-interested-topics` serialized-execution and dedup requirements; no restore step remains.
