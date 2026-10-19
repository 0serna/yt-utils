# Spec Delta

## ADDED Requirements

### Requirement: No decidir subtítulos durante un cambio de audio en curso

The system SHALL NOT leer ni aplicar una selección de subtítulos mientras haya un cambio de pista de audio en curso. La política SHALL reanudar la decisión cuando el cambio termine o se abandone.

#### Scenario: Cambio de audio en curso

- **WHEN** `original-audio-track` está aplicando una pista y la política empieza un ciclo de sondeo
- **THEN** la política no apaga ni enciende subtítulos en ese ciclo

#### Scenario: Cambio de audio confirmado

- **WHEN** el cambio termina y el audio queda en la pista original
- **THEN** el siguiente ciclo de la política decide con el audio nuevo

#### Scenario: Cambio de audio abandonado

- **WHEN** `original-audio-track` agota sus intentos sin cambiar la pista
- **THEN** la política vuelve a decidir con el audio que quedó activo
