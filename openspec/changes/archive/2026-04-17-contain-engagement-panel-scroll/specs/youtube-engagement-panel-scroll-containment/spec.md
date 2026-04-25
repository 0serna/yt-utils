## Purpose

Keep wheel scrolling contained inside supported YouTube engagement panels on watch pages so panel interaction does not spill into the underlying page.

## Requirements

### Requirement: Contain scrolling within supported engagement panels

The system MUST keep wheel scrolling inside an expanded YouTube watch-page engagement panel when the panel exposes its own primary content scroll container, so reaching the panel's scroll boundary does not scroll the underlying watch page.

#### Scenario: Ask panel reaches its scroll boundary

- **WHEN** the YouTube `Ask` panel is expanded and the user scrolls within the panel until its main content area reaches the top or bottom boundary
- **THEN** the scroll input MUST remain contained within the `Ask` panel
- **AND** the underlying watch page MUST NOT begin scrolling

#### Scenario: In this video or Chapters panel reaches its scroll boundary

- **WHEN** an expanded `In this video` or `Chapters` engagement panel exposes a primary content scroller and the user scrolls that content to its top or bottom boundary
- **THEN** the scroll input MUST remain contained within the expanded panel
- **AND** the underlying watch page MUST NOT begin scrolling

#### Scenario: Transcript view replaces the panel internals

- **WHEN** an expanded engagement panel switches from one internal view to another, including switching to `Transcript`, and the replacement view exposes a primary content scroller
- **THEN** the system MUST continue containing wheel scrolling within the active panel view
- **AND** the underlying watch page MUST NOT begin scrolling from panel-boundary wheel input

#### Scenario: Panel internals are rerendered during watch-page lifetime

- **WHEN** YouTube rerenders or recreates the DOM inside an expanded engagement panel while the watch page remains open
- **THEN** the system MUST continue to contain scrolling within the panel after the rerender

#### Scenario: No supported panel scroller is available

- **WHEN** no expanded watch-page engagement panel exposes a detectable primary content scroller
- **THEN** the system MUST NOT throw an error
- **AND** the watch page MUST retain its normal scrolling behavior
