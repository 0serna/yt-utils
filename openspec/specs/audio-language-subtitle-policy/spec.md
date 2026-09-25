# audio-language-subtitle-policy Specification

## Purpose

La política de subtítulos decide a partir del idioma activo del audio del player; debe seguir resolviendo español e inglés aunque YouTube renombre las llaves minificadas de metadata de audio.

## Requirements

### Requirement: Resolución de idioma tolerante a renames de metadata

The system SHALL resolver el idioma activo del audio desde la metadata del audio-track aunque la llave minificada cambie de nombre, y SHALL tratar como desconocido solo cuando no haya metadata usable.

#### Scenario: Audio español bajo llave wM

- **WHEN** el audio-track activo expone `wM: { id: "es-US.4", name: "Spanish (US) original" }`
- **THEN** el sistema lo trata como audio no-inglés y no activa subtítulos ingleses.

#### Scenario: Llave futura desconocida con forma válida

- **WHEN** el audio-track activo expone una llave no listada con forma `{ id: "es-MX.4", name: "Spanish (Mexico)" }`
- **THEN** el sistema lo trata como audio español y no activa subtítulos ingleses.

#### Scenario: Metadata desconocida real sigue desconocida

- **WHEN** el audio-track activo solo expone `id: "und"` sin nombre usable
- **THEN** el sistema lo trata como idioma desconocido y no infiere idioma desde pistas de captions salvo ASR inglés directo.

#### Scenario: Pistas de captions no se confunden con audio

- **WHEN** el audio-track contiene pistas de captions o slots `S`/`W` con forma de caption
- **THEN** el sistema no los usa como metadata de idioma de audio.
