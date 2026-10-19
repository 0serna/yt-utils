# Spec Delta

## ADDED Requirements

### Requirement: Distinguir override de subtítulos de cambio de audio

The system SHALL tratar como Subtitle Override solo un cambio del estado de subtítulos que la política no causó. Un cambio de la pista de audio NUNCA SHALL contar como Subtitle Override.

#### Scenario: Usuario apaga subtítulos a mano

- **WHEN** la política dejó subtítulos `en` encendidos y el usuario los apaga
- **THEN** el sistema marca la Watch Session como override y no vuelve a encenderlos

#### Scenario: Audio cambia y el subtítulo sigue igual

- **WHEN** la pista de audio cambia de `es-US` a `en-US` y los subtítulos quedan apagados
- **THEN** el sistema no marca override y aplica la selección que corresponde al audio nuevo

#### Scenario: Cambio de audio repite la pista de subtítulos

- **WHEN** la pista de audio cambia y la pista de subtítulos activa sigue siendo la misma
- **THEN** el sistema recalcula la selección y aplica solo si difiere

### Requirement: Recálculo al cambiar la pista de audio

The system SHALL volver a decidir la selección de subtítulos en el siguiente ciclo de sondeo cuando cambie la firma de audio del player, aunque ya haya aplicado una selección en esa Watch Session.

#### Scenario: Audio original pasa a español

- **WHEN** `original-audio-track` cambia el audio a `es-US` y la política ya había aplicado subtítulos `en`
- **THEN** el sistema apaga los subtítulos

#### Scenario: Audio español pasa a inglés

- **WHEN** el audio pasa de `es-US` a `en-US` con subtítulos apagados
- **THEN** el sistema enciende la pista inglesa disponible

#### Scenario: Override previo bloquea el recálculo

- **WHEN** la Watch Session ya está marcada como override
- **THEN** el sistema no vuelve a tocar los subtítulos en esa sesión, aunque cambie el audio

### Requirement: Ventana de gracia por aplicación

The system SHALL medir la ventana de gracia desde la última aplicación de subtítulos, no desde la primera, para no marcar override por cambios del player que llegan después de un apply tardío.

#### Scenario: Reaplicación tardía del player

- **WHEN** el player reajusta subtítulos dentro de los segundos posteriores a una aplicación de la política
- **THEN** el sistema no marca override y vuelve a aplicar su selección
