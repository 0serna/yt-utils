## ADDED Requirements

### Requirement: MAIN-world shared imports are pure

Shared modules imported by MAIN-world scripts SHALL avoid Chrome APIs, feature lifecycle state, and top-level DOM side effects so they can be safely bundled into MAIN-world content script entries.

#### Scenario: MAIN-world bridge imports shared model code

- **WHEN** a MAIN-world script imports shared player model code
- **THEN** the imported module contains only types, constants, and pure helpers that are safe to execute in the page context

### Requirement: Player bridge protocol model is centralized

The project SHALL define shared YouTube player bridge protocol types and constants in one module when both the MAIN-world bridge and isolated-world client use them.

#### Scenario: Bridge protocol is used by both worlds

- **WHEN** the MAIN-world bridge and isolated-world client exchange player messages
- **THEN** both sides use the same shared protocol model definitions instead of duplicated local definitions
