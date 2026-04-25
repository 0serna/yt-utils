## ADDED Requirements

### Requirement: Feature interface defines lifecycle

Every feature SHALL implement a `Feature` interface with a `name` string, an optional `isWatchPage` boolean predicate, an `activate(context)` method, and a `deactivate()` method.

#### Scenario: Feature implements the interface

- **WHEN** a new feature module is created under `src/features/<name>/content.ts`
- **THEN** it exports an object satisfying the `Feature` interface with `name`, `activate`, and `deactivate` methods

### Requirement: FeatureRegistry coordinates feature lifecycle on navigation

The content script SHALL use a `FeatureRegistry` that listens to YouTube SPA navigation events and activates or deactivates features based on the current page URL.

#### Scenario: Navigating to a supported watch page

- **WHEN** YouTube's `yt-navigate-finish` event fires and the URL matches a supported watch page
- **THEN** the registry calls `deactivate()` on all active features and then calls `activate()` on each feature whose `isWatchPage` condition matches

#### Scenario: Navigating away from a watch page

- **WHEN** YouTube's `yt-navigate-finish` event fires and the URL no longer matches a supported watch page
- **THEN** the registry calls `deactivate()` on all active watch-page features

### Requirement: Content script barrel registers all features

The `src/content.ts` barrel file SHALL import all feature modules and register them with the `FeatureRegistry` before any navigation events are processed.

#### Scenario: All features available at startup

- **WHEN** the content script loads on a YouTube page
- **THEN** all feature modules are imported and registered with the `FeatureRegistry` before the first navigation event is handled
