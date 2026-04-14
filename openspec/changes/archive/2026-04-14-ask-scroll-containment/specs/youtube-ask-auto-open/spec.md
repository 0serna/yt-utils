## ADDED Requirements

### Requirement: Contain scrolling within the Ask panel
The system MUST keep scroll input inside the YouTube `Ask` panel when the panel is expanded, so scrolling at the top or bottom of the chat does not scroll the underlying watch page.

#### Scenario: Ask panel reaches its scroll boundary
- **WHEN** the `Ask` panel is expanded and the user scrolls within the chat until the chat reaches its top or bottom boundary
- **THEN** the scroll input MUST remain contained within the `Ask` panel
- **AND** the underlying YouTube page MUST NOT begin scrolling

#### Scenario: Ask panel is not available
- **WHEN** a supported YouTube watch page does not expose the `Ask` panel
- **THEN** the system MUST NOT throw an error
- **AND** the page MUST behave normally for its own scrolling

#### Scenario: Ask panel is rerendered
- **WHEN** YouTube rerenders or recreates the `Ask` panel while the watch page remains open
- **THEN** the system MUST continue to contain scrolling within the panel after the rerender
