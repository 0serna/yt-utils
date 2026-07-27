## ADDED Requirements

### Requirement: Extension removes Playables Shelves from Home

The extension SHALL detect and remove every Playables Shelf section from the desktop Home page `www.youtube.com/`. A Playables Shelf is a `ytd-rich-shelf-renderer` that contains a link whose path includes `/playables`. The extension SHALL remove the shelf's closest parent `ytd-rich-section-renderer` from the DOM.

#### Scenario: Playables Shelf is removed on Home page load

- **WHEN** the user opens desktop Home and a Playables Shelf is present
- **THEN** the extension removes that shelf's parent section from the DOM

#### Scenario: Multiple Playables Shelves are all removed

- **WHEN** desktop Home contains more than one Playables Shelf
- **THEN** the extension removes every matching shelf's parent section from the DOM

### Requirement: Extension preserves non-Playables Home content

The extension SHALL leave other Home shelves and video cards visible and functional when removing Playables Shelves.

#### Scenario: Regular Home video cards remain visible

- **WHEN** the extension removes a Playables Shelf from desktop Home
- **THEN** regular Home video cards and non-Playables shelves outside that section remain in the DOM

### Requirement: Playables removal remains stable across rerenders

The extension SHALL re-apply Playables Shelf removal after YouTube SPA navigation or dynamic Home feed rerenders on desktop Home.

#### Scenario: SPA navigation into Home removes Playables Shelf

- **WHEN** the user navigates into `www.youtube.com/` through YouTube's SPA navigation and a Playables Shelf is present
- **THEN** the extension removes the Playables Shelf section

#### Scenario: Home rerender removes reinserted Playables Shelf

- **WHEN** YouTube dynamically rerenders Home and reinserts a Playables Shelf section
- **THEN** the extension removes the reinserted shelf section again

### Requirement: Playables removal is scoped to Home

The extension SHALL NOT remove Playables Shelves on YouTube pages other than desktop Home.

#### Scenario: Unsupported page is not modified

- **WHEN** the user is on any YouTube page other than desktop Home
- **THEN** the extension does not attempt to remove Playables Shelf sections
