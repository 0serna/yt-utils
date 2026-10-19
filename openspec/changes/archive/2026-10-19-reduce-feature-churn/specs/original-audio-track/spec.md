# Spec Delta

## ADDED Requirements

### Requirement: Anunciar el cambio de audio en curso

The system SHALL marcar el cambio de audio como en curso antes de pedir la pista original, y SHALL limpiar esa marca en todos sus finales: pista confirmada, intentos agotados, o desactivación de la feature.

#### Scenario: Cambio pedido al player

- **WHEN** la feature decide aplicar la pista original
- **THEN** marca el cambio como en curso antes de llamar al player

#### Scenario: Pista confirmada

- **WHEN** el player reporta la pista original como activa
- **THEN** la feature limpia la marca y marca la Watch Session como resuelta

#### Scenario: Intentos agotados

- **WHEN** la feature llega a su límite de intentos sin cambiar la pista
- **THEN** limpia la marca al abandonar la Watch Session

#### Scenario: Feature desactivada a mitad de cambio

- **WHEN** la feature se desactiva mientras el cambio sigue en curso
- **THEN** limpia la marca para no bloquear a la política de subtítulos
