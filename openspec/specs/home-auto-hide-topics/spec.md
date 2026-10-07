# home-auto-hide-topics Specification

## Purpose

Hides Home video cards that match the per-topic registry locally, without triggering YouTube's native Not Interested action.

## Requirements

### Requirement: Hiding applies only on Home desktop

The system SHALL hide cards only on the desktop Home feed at `www.youtube.com/` with `pathname === "/"`.

#### Scenario: Home hides matching card

- **WHEN** el usuario abre `https://www.youtube.com/` y aparece una tarjeta del tema `clash-royale`
- **THEN** el sistema oculta esa tarjeta.

#### Scenario: Other pages never hide

- **WHEN** el usuario abre suscripciones, búsqueda o watch
- **THEN** el sistema no oculta ninguna tarjeta.

### Requirement: Topic registry with channels and keywords

The system SHALL match per topic against visible card text (video title, channel name, handle) normalized to lowercase without diacritics by case-insensitive substring; a channel match OR a keyword match suffices. Topics SHALL be fixed in versioned code.

#### Scenario: Known channel without keyword gets hidden

- **WHEN** una tarjeta muestra `Hero Electro Wizard` con canal `Ken`
- **THEN** el sistema la oculta.

#### Scenario: Jargon without core keyword gets hidden

- **WHEN** una tarjeta muestra `New Troop and Equipment in October Season!` con canal `Judo Sloth Gaming`
- **THEN** el sistema la oculta.

#### Scenario: Case and diacritics are normalized

- **WHEN** una tarjeta muestra `EL NUEVO MAGO ELÉCTRICO SORPRENDIÓ`
- **THEN** el sistema la oculta.

#### Scenario: Unrelated video is preserved

- **WHEN** una tarjeta muestra `Kubernetes Simply Explained` con canal tech sin match
- **THEN** el sistema no la oculta.

### Requirement: Clash Royale v1 seed

The v1 `clash-royale` topic SHALL seed channels `judo sloth`, `surgical goblin`, `kj maggard`, `mamoyan`, `ken` and keywords `clash`, `clash royale`, `clashroyale`, `#clashroyale`, `クラロワ`, `클래시로얄`, `beniju`, `benijugoso`, `balegg`, `mazo`, `mazos`, `gigante noble`, `montapuerc`, `supercell`, `electro wizard`, `mago electrico`, `troop`, `equipment`.

#### Scenario: Broad clash mention hides

- **WHEN** una tarjeta muestra `La MERECIDA CAÍDA de CLASH ROYALE` con canal desconocido
- **THEN** el sistema la oculta.

#### Scenario: Japanese variant hides

- **WHEN** una tarjeta muestra `【クラロワ】オクラロワ`
- **THEN** el sistema la oculta.

### Requirement: Local hiding without native action

The system SHALL hide each matching card by writing its own hidden state (`display: none` plus an owned marker) and SHALL NOT open the native `...` menu, click `No me interesa`, trigger any other native action, or render custom UI. Hiding SHALL be idempotent across repeated scans. When a hidden card stops matching, the system SHALL remove its hidden state.

#### Scenario: Matching card is hidden without native flow

- **WHEN** una tarjeta del tema aparece y su menú `...` está disponible
- **THEN** la tarjeta queda oculta y no hay ningún clic en `...` ni en `No me interesa`.

#### Scenario: Recycled card for another video is restored

- **WHEN** YouTube reutiliza una tarjeta oculta para un video sin match
- **THEN** el sistema quita su ocultado propio y la tarjeta vuelve a mostrarse.

### Requirement: Dynamic feed coverage and deactivation

The system SHALL hide matching cards from initial render, scroll, and SPA re-render through a coalesced mutation observer. On deactivation the system SHALL stop observing and SHALL NOT restore hidden cards; hidden state SHALL persist until YouTube recreates the card or the page reloads.

#### Scenario: Scroll loads matching card

- **WHEN** aparecen nuevas tarjetas del tema tras scroll
- **THEN** el sistema las oculta automáticamente.

#### Scenario: Deactivation keeps hidden cards hidden

- **WHEN** el feature se desactiva al salir de Home o al desregistrarse
- **THEN** el observer se detiene y las tarjetas ocultas siguen ocultas.

#### Scenario: Reload hides again

- **WHEN** el usuario recarga Home y las tarjetas del tema vuelven a renderizar
- **THEN** el sistema las oculta otra vez.
