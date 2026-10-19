# audio-language-subtitle-policy Specification

## Purpose

La política de subtítulos decide a partir del idioma activo del audio del player; debe seguir resolviendo español e inglés aunque YouTube renombre las llaves minificadas de metadata de audio.

## Requirements

### Requirement: Resolución de idioma tolerante a renames de metadata

The system SHALL resolver el idioma activo del audio desde la metadata del audio-track aunque la llave minificada cambie de nombre, y SHALL tratar como desconocido solo cuando no haya metadata usable.

#### Scenario: Audio español bajo llave wM

- **WHEN** el audio-track activo expone `wM: { id: "es-US.4", name: "Spanish (US) original" }`
- **THEN** el sistema lo trata como audio español y no activa subtítulos ingleses.

#### Scenario: Llave futura desconocida con forma válida

- **WHEN** el audio-track activo expone una llave no listada con forma `{ id: "es-MX.4", name: "Spanish (Mexico)" }`
- **THEN** el sistema lo trata como audio español y no activa subtítulos ingleses.

#### Scenario: Metadata desconocida real sigue desconocida

- **WHEN** el audio-track activo solo expone `id: "und"` sin nombre usable
- **THEN** el sistema lo trata como idioma desconocido y no usa pistas de captions como idioma de audio.

#### Scenario: Pistas de captions no se confunden con audio

- **WHEN** el audio-track contiene pistas de captions o slots `S`/`W` con forma de caption
- **THEN** el sistema no los usa como metadata de idioma de audio.

### Requirement: Selección de subtítulos en inglés salvo audio español

The system SHALL apagar los subtítulos solo cuando el audio activo es español, y SHALL encender subtítulos en inglés para audio inglés, otro idioma conocido, o idioma desconocido cuando hay pista inglesa disponible.

#### Scenario: Audio español apaga aunque haya pista inglesa

- **WHEN** el audio activo es `es-US` y existe pista `en` directa
- **THEN** el sistema selecciona `off`.

#### Scenario: Audio inglés enciende pista directa

- **WHEN** el audio activo es `en-US` y existe pista `en` directa
- **THEN** el sistema selecciona esa pista.

#### Scenario: Audio no español conocido enciende pista directa

- **WHEN** el audio activo es `fr` y existe pista `en` directa
- **THEN** el sistema selecciona esa pista.

#### Scenario: Audio desconocido con pista directa enciende

- **WHEN** el audio activo es `und` y existe pista `en` directa con `vssId: ".en"`
- **THEN** el sistema selecciona esa pista.

#### Scenario: Audio desconocido con ASR enciende

- **WHEN** el audio activo es desconocido y existe pista `en` autogenerada con `vssId: "a.en"`
- **THEN** el sistema selecciona esa pista.

#### Scenario: Prioridad directa sobre ASR

- **WHEN** existen pista `en` directa y pista `en` autogenerada
- **THEN** el sistema selecciona la pista directa.

#### Scenario: Sin pista inglesa apaga

- **WHEN** no existe pista `en` directa ni autogenerada
- **THEN** el sistema selecciona `off`.

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
