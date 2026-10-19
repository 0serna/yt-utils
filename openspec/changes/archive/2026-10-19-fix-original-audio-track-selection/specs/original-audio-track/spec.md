# Spec Delta

## MODIFIED Requirements

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
