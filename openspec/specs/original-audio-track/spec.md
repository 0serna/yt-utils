# original-audio-track Specification

## Purpose

Mantener la pista de audio original activa en cada vídeo, sin depender de extensiones externas ni de clicks en el menú de ajustes del player.

## Requirements

### Requirement: Pista original en cada Watch Session

The system SHALL activar la Original Audio Track al inicio de cada Watch Session cuando la pista activa sea una Dubbed Audio Track y exista una pista original disponible.

La pista original se identifica primero por el contenido `original` codificado en su id, o por un nombre que la marque como original. Si ninguna pista ofrece esas señales, se usa la primera pista con `isAutoDubbed: false`. Si ninguna pista declara ese campo, se usa la primera pista con `isDefault: true`.

#### Scenario: Audio doblado con original disponible

- **WHEN** el vídeo arranca con la pista `es-US` (`isAutoDubbed: true`) activa y existe `en-US` (`isAutoDubbed: false`)
- **THEN** el sistema activa la pista `en-US`

#### Scenario: Flags contradictorios con nombre original

- **WHEN** todas las pistas declaran `isAutoDubbed: false`, la pista activa árabe declara `isDefault: true` y existe una pista `English original` con `isDefault: false`
- **THEN** el sistema activa la pista `English original`

#### Scenario: Id con contenido original

- **WHEN** el id de una pista incluye el contenido codificado `original` y otra pista incluye `dubbed`
- **THEN** el sistema elige la pista con `original`

#### Scenario: Audio original ya activo

- **WHEN** la pista activa ya es la original
- **THEN** el sistema no llama a `setAudioTrack` y no emite diagnóstico de cambio

#### Scenario: Sin pista original identificable

- **WHEN** ninguna pista ofrece contenido o nombre de original y los flags no identifican una pista original
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
