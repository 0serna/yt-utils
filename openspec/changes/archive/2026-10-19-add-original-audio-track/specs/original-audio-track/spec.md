# Spec Delta

## Purpose

Mantener la pista de audio original activa en cada vídeo, sin depender de extensiones externas ni de clicks en el menú de ajustes del player.

## ADDED Requirements

### Requirement: Pista original en cada Watch Session

The system SHALL activar la Original Audio Track al inicio de cada Watch Session cuando la pista activa sea una Dubbed Audio Track y exista una pista original disponible.

La pista original se identifica por `isAutoDubbed: false`. Si ninguna pista declara ese campo, se usa la primera pista con `isDefault: true`.

#### Scenario: Audio doblado con original disponible

- **WHEN** el vídeo arranca con la pista `es-US` (`isAutoDubbed: true`) activa y existe `en-US` (`isAutoDubbed: false`)
- **THEN** el sistema activa la pista `en-US`

#### Scenario: Audio original ya activo

- **WHEN** la pista activa ya es la original
- **THEN** el sistema no llama a `setAudioTrack` y no emite diagnóstico de cambio

#### Scenario: Sin pista original identificable

- **WHEN** ninguna pista disponible declara `isAutoDubbed` ni `isDefault`
- **THEN** el sistema deja el audio actual sin cambios

#### Scenario: Una sola aplicación por Watch Session

- **WHEN** el sistema ya aplicó la pista original en la Watch Session actual
- **THEN** no vuelve a llamar a `setAudioTrack` aunque la pista activa cambie después

#### Scenario: Cambio de vídeo

- **WHEN** la extensión empieza una Watch Session nueva
- **THEN** vuelve a evaluar y aplicar la pista original para ese vídeo

### Requirement: Lectura de pistas antes de la decisión

The system SHALL leer las pistas de audio disponibles desde el player y SHALL reintentar mientras la lista venga vacía o incompleta, sin bloquear la reproducción.

#### Scenario: Lista de pistas aún vacía

- **WHEN** el player todavía no expone pistas de audio al inicio de la Watch Session
- **THEN** el sistema espera y reintenta en el siguiente ciclo de sondeo

#### Scenario: Pista original sin metadata usable

- **WHEN** una pista declara `isAutoDubbed: false` pero no declara `id` ni `name`
- **THEN** el sistema usa el id de la pista para aplicarla

### Requirement: Aplicación tolerante a fallos

The system SHALL continuar la Watch Session cuando la aplicación de audio falla, y SHALL dejar el audio actual intacto cuando el player no ofrece la API de audio.

#### Scenario: Player sin API de audio

- **WHEN** el player no expone `getAvailableAudioTracks` o `setAudioTrack`
- **THEN** el sistema no aplica nada y no registra un error de feature

#### Scenario: Rechazo del player

- **WHEN** `setAudioTrack` no cambia la pista activa antes del siguiente ciclo de sondeo
- **THEN** el sistema reintenta dentro de la misma Watch Session, hasta un límite acotado, y luego deja de intentar
