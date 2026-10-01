# Spec Delta

## Purpose

Automates YouTube's native Not Interested action on Home for configured unwanted topics, starting with Clash Royale and extensible to future topics without rewriting the engine.

## ADDED Requirements

### Requirement: Auto applies only on Home desktop

The system SHALL trigger automatic Not Interested only on the desktop Home feed at `www.youtube.com/` with `pathname === "/"`.

#### Scenario: Home auto-marks matching card

- **WHEN** el usuario abre `https://www.youtube.com/` y aparece una tarjeta del tema `clash-royale`
- **THEN** el sistema dispara la acción nativa `No me interesa` para esa tarjeta.

#### Scenario: Other pages never auto-mark

- **WHEN** el usuario abre suscripciones, búsqueda o watch
- **THEN** el sistema no dispara ninguna acción automática.

### Requirement: Topic registry with channels and keywords

The system SHALL match per topic against visible card text (video title, channel name, handle) normalized to lowercase without diacritics by case-insensitive substring; a channel match OR a keyword match suffices. Topics SHALL be fixed in versioned code. The v1 `clash-royale` seed SHALL include channels `judo sloth`, `surgical goblin`, `kj maggard`, `mamoyan`, `ken` plus jargon `electro wizard`, `mago electrico`, `troop`, `equipment` alongside the existing `home-keyword-filter` keyword set.

#### Scenario: Known channel without keyword gets marked

- **WHEN** una tarjeta muestra `Hero Electro Wizard` con canal `Ken`
- **THEN** el sistema la marca como `No me interesa`.

#### Scenario: Jargon without core keyword gets marked

- **WHEN** una tarjeta muestra `New Troop and Equipment in October Season!` con canal `Judo Sloth Gaming`
- **THEN** el sistema la marca como `No me interesa`.

#### Scenario: Unrelated video is preserved

- **WHEN** una tarjeta muestra `Kubernetes Simply Explained` con canal tech sin match
- **THEN** el sistema no dispara ninguna acción.

### Requirement: Serialized execution on dynamic feed

The system SHALL process detected cards through a serialized native-menu queue as they appear via initial render, scroll, or SPA re-render, reusing the native `...` menu and `No me interesa` item with the existing timeout semantics. The system SHALL NOT apply its own `display:none` hiding.

#### Scenario: Scroll loads matching card

- **WHEN** aparecen nuevas tarjetas del tema tras scroll
- **THEN** se encolan y se marcan de una en una.

#### Scenario: No local hiding applied

- **WHEN** una tarjeta del tema es detectada
- **THEN** el sistema no escribe `display:none` propio sobre la tarjeta.

### Requirement: Session dedup with bounded retries and silent errors

The system SHALL attempt each `videoId` at most N times per session (default 3, extracted from the card `watch?v=` href with card-identity fallback); successes SHALL NOT be retried in the session, failures SHALL be retried on later passes until the limit, and after the limit the card SHALL stay visible. The system SHALL only log via `logger.error` when the limit is exhausted or the native menu item is unavailable, with no custom UI.

#### Scenario: Same video is not reprocessed

- **WHEN** un `videoId` ya marcado vuelve a detectarse en la sesión
- **THEN** el sistema no vuelve a abrir su menú.

#### Scenario: Exhausted retries stay visible

- **WHEN** un `videoId` agota sus 3 intentos sin completar la acción nativa
- **THEN** la tarjeta permanece visible y solo queda un error en el log.
