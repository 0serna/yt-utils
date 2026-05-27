## MODIFIED Requirements

### Requirement: Feature interface defines lifecycle

Every feature SHALL implement a `Feature` interface with a `name` string, an optional `isWatchPage` boolean predicate, an `activate(context)` method, and a `deactivate()` method. The activation context SHALL include `sendMessage` and a feature-scoped logger.

#### Scenario: Feature implements the interface

- **WHEN** a new feature module is created under `src/features/<name>/content.ts`
- **THEN** it exports an object satisfying the `Feature` interface with `name`, `activate`, and `deactivate` methods

#### Scenario: Feature receives logger context

- **WHEN** the registry activates a feature
- **THEN** it passes a `FeatureContext` containing `sendMessage` and a logger scoped to that feature name

### Requirement: FeatureRegistry coordinates feature lifecycle on navigation

The content script SHALL use a `FeatureRegistry` that listens to YouTube SPA navigation events and activates or deactivates features based on the current page URL. The registry SHALL log successful activation and deactivation, log activation/deactivation errors, and isolate lifecycle failures so one feature does not prevent processing other features.

#### Scenario: Navigating to a supported watch page

- **WHEN** YouTube's `yt-navigate-finish` event fires and the URL matches a supported watch page
- **THEN** the registry calls `deactivate()` on all active features and then calls `activate()` on each feature whose `isWatchPage` condition matches

#### Scenario: Navigating away from a watch page

- **WHEN** YouTube's `yt-navigate-finish` event fires and the URL no longer matches a supported watch page
- **THEN** the registry calls `deactivate()` on all active watch-page features

#### Scenario: Feature activates successfully

- **WHEN** a matching feature's `activate(context)` method completes without throwing
- **THEN** the registry records an activation log entry and marks the feature active

#### Scenario: Feature activation fails

- **WHEN** a matching feature's `activate(context)` method throws an error
- **THEN** the registry records an error log entry with phase `activate`, does not mark the feature active, and continues evaluating remaining features

#### Scenario: Feature deactivates successfully

- **WHEN** an active feature's `deactivate()` method completes without throwing
- **THEN** the registry records a deactivation log entry and removes the feature from the active set

#### Scenario: Feature deactivation fails

- **WHEN** an active feature's `deactivate()` method throws an error
- **THEN** the registry records an error log entry with phase `deactivate`, removes the feature from the active set, does not record a successful deactivation log entry, and continues deactivating remaining features
