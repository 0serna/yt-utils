## MODIFIED Requirements

### Requirement: FeatureRegistry coordinates feature lifecycle on navigation

The content script SHALL use a `FeatureRegistry` that listens to YouTube SPA navigation events and activates or deactivates features based on the current page and, for supported watch pages, the current URL video ID. The registry SHALL log successful activation and deactivation, log activation/deactivation errors, and isolate lifecycle failures so one feature does not prevent processing other features.

#### Scenario: Navigating to a supported watch page

- **WHEN** YouTube's `yt-navigate-finish` event fires and the URL matches a supported watch page
- **THEN** the registry calls `deactivate()` on all active features and then calls `activate()` on each feature whose `isWatchPage` condition matches

#### Scenario: Navigating from one watch video to another by SPA navigation

- **WHEN** YouTube's SPA navigation changes the supported watch-page URL `v` query parameter from one video ID to another
- **THEN** the registry treats the change as a new watch video session
- **AND** the registry calls `deactivate()` on active watch-page features before activating matching watch-page features for the new video session

#### Scenario: Watch URL changes without changing video ID

- **WHEN** the user remains on a supported watch page with the same `v` query parameter
- **AND** other URL parts such as `t`, `pp`, or `feature` change
- **THEN** the registry does not deactivate and reactivate watch-page features solely because of that same-video URL change

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
