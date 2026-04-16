## ADDED Requirements

### Requirement: Extension detects supported selected text on ordinary webpages
The extension SHALL detect non-empty selected text on supported webpages for both standard document selections and selections inside focused `input` or `textarea` controls.

#### Scenario: Detecting selected document text
- **WHEN** the user selects non-empty visible text in the page document on a supported webpage
- **THEN** the extension recognizes the selected text as eligible for inline search

#### Scenario: Detecting selected text inside a text control
- **WHEN** the user selects non-empty text inside a focused `input` or `textarea` on a supported webpage
- **THEN** the extension recognizes the selected text as eligible for inline search

#### Scenario: Ignoring empty selections
- **WHEN** the active selection is empty or contains only whitespace
- **THEN** the extension does not treat it as eligible for inline search

### Requirement: Extension shows an immediate inline Google-search action for supported selections
The extension SHALL show a floating Google-search action immediately after a supported non-empty selection is made, and it SHALL position the action adjacent to the selected content or selected control.

#### Scenario: Showing action for page text selection
- **WHEN** the user completes a supported non-empty page-text selection
- **THEN** the extension shows a floating Google-search action without an added time delay

#### Scenario: Showing action for keyboard-driven selection
- **WHEN** the user creates a supported non-empty selection using keyboard selection controls
- **THEN** the extension shows the floating Google-search action for that selection

#### Scenario: Repositioning action for a changed selection
- **WHEN** the selected text changes while remaining eligible for inline search
- **THEN** the extension updates the floating action so it remains associated with the current selection

### Requirement: Extension removes the inline action when the selection is no longer active
The extension SHALL hide the floating Google-search action when the associated selection is cleared, replaced by an ineligible selection, or otherwise loses its active context.

#### Scenario: Hiding action after selection collapse
- **WHEN** the user clears the selection or collapses it to a caret
- **THEN** the floating Google-search action is removed

#### Scenario: Hiding action after context loss
- **WHEN** the page state changes such that the original selection is no longer active, including focus loss or a dismissing page interaction
- **THEN** the floating Google-search action is removed

### Requirement: Extension opens Google search results in a new tab
The extension SHALL open a new browser tab to Google search results for the active selected text when the user activates the floating Google-search action.

#### Scenario: Opening search in a new tab
- **WHEN** the user clicks the floating Google-search action for an eligible selection
- **THEN** the extension opens a new tab with a Google search query for the selected text

#### Scenario: Preserving the current page while searching
- **WHEN** the extension opens the Google search for the selected text
- **THEN** the current page remains open in its existing tab
