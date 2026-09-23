# Spec Delta

## Purpose

Permite ocultar del Home los videos de un tema no deseado mediante keywords visibles, empezando por Clash Royale y extensible a otros términos.

## ADDED Requirements

### Requirement: Filtro aplica solo en Home desktop

The system SHALL apply keyword filtering only on the desktop Home feed at `www.youtube.com/` with `pathname === "/"`.

#### Scenario: Home filtra

- **WHEN** el usuario abre `https://www.youtube.com/`
- **THEN** las tarjetas coincidentes se ocultan.

#### Scenario: Otras páginas no filtran

- **WHEN** el usuario abre suscripciones, búsqueda o watch
- **THEN** ninguna tarjeta se oculta por este filtro.

### Requirement: Match por título, canal y handle normalizados

The system SHALL match usando el texto visible de la tarjeta: título del video, nombre del canal y handle, normalizados a minúsculas sin tildes, por substring case-insensitive.

#### Scenario: Título con Clash Royale se oculta

- **WHEN** una tarjeta muestra `La MERECIDA CAÍDA de CLASH ROYALE...`
- **THEN** se oculta.

#### Scenario: Canal conocido sin keyword en título se oculta

- **WHEN** una tarjeta muestra `BENIJU SALE DEL TILT...` con canal `BENIJUGOSO`
- **THEN** se oculta.

#### Scenario: Video no relacionado se preserva

- **WHEN** una tarjeta muestra `Kubernetes Simply Explained` con canal tech
- **THEN** permanece visible.

### Requirement: Lista inicial Clash Royale con núcleo y jerga

The system SHALL bloquear en v1 `clash` en sentido amplio (incluye Clash of Clans), variantes de `clash royale`, `#clashroyale`, `クラロワ`, `클래시로얄`, canales observados Clash y jerga `mazo`, `gigante noble`, `montapuercos`, `supercell`.

#### Scenario: Variante japonesa se oculta

- **WHEN** una tarjeta muestra `【クラロワ】オクラロワ`
- **THEN** se oculta.

#### Scenario: Mención amplia de clash se oculta

- **WHEN** una tarjeta muestra `Nomgar Clash / RONIN`
- **THEN** se oculta.

#### Scenario: Jerga de mazo se oculta

- **WHEN** una tarjeta muestra `A POR EL TOP 10... CLASH ROYALE EN VIVO *MEJORES MAZOS*`
- **THEN** se oculta.

### Requirement: Feed dinámico y restauración reversible

The system SHALL filtrar tarjetas agregadas por scroll o re-render SPA sin recargar, y SHALL restaurar todas las tarjetas ocultas al desactivar.

#### Scenario: Scroll carga Clash y se oculta

- **WHEN** aparecen nuevas tarjetas Clash tras scroll
- **THEN** se ocultan automáticamente.

#### Scenario: Salir de Home restaura

- **WHEN** el feature se desactiva por navegación o registro
- **THEN** las tarjetas vuelven a ser visibles.
