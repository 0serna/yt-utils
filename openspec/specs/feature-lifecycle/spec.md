# feature-lifecycle Specification

## Purpose
Definir cuándo una feature se activa y se desactiva, para que el arranque de la extensión no repita trabajo ni ensucie el historial de logs.

## Requirements

### Requirement: Un arranque por carga de documento

The system SHALL activar cada feature como máximo una vez por registro y por carga de documento. Registrar una feature SHALL NOT activarla por sí solo.

#### Scenario: Registro de todas las features

- **WHEN** `src/content.ts` registra 15 features y después llama a `start()`
- **THEN** cada feature que aplica a la URL se activa una sola vez

#### Scenario: Feature registrada después del arranque

- **WHEN** se registra una feature con el registro ya arrancado
- **THEN** esa feature se activa en ese momento, sin esperar al siguiente evento de navegación

#### Scenario: Cambio de vídeo

- **WHEN** la URL pasa a otro vídeo del watch de escritorio
- **THEN** las features activas se desactivan una vez y se vuelven a activar una vez

### Requirement: Un evento de log por activación real

The system SHALL escribir una entrada `activation` y una `deactivation` por cada activación y desactivación real de una feature, sin entradas intermedias del arranque.

#### Scenario: Carga de una página de watch

- **WHEN** la página carga con N features que aplican a la URL
- **THEN** el historial recibe N activaciones y ninguna desactivación inicial

#### Scenario: Navegación a otro vídeo

- **WHEN** la sesión cambia de vídeo
- **THEN** el historial recibe una desactivación y una activación por feature activa
