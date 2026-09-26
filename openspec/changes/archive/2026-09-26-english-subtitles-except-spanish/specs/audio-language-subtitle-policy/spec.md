# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

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
