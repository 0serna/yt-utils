## 1. Logging Types and Utility

- [x] 1.1 Add shared log entry, logger metadata, and feature logger types.
- [x] 1.2 Implement a shared feature logger utility that writes to `chrome.storage.local` key `yt-utils:logs`.
- [x] 1.3 Add serialized write queue behavior so concurrent log writes preserve chronological entries.
- [x] 1.4 Implement retention trimming to keep only the latest 1000 log entries.
- [x] 1.5 Implement URL context capture with full `window.location.href` and optional `videoId` extraction.
- [x] 1.6 Implement error normalization for message, optional code, and optional stack.
- [x] 1.7 Mirror logger error events to `console.error` without mirroring activation/deactivation events.

## 2. Feature Context and Registry Integration

- [x] 2.1 Extend `FeatureContext` to include a feature-scoped logger.
- [x] 2.2 Update `FeatureRegistry` to create and pass a logger for each activated feature.
- [x] 2.3 Log successful feature activation from the registry.
- [x] 2.4 Log successful feature deactivation from the registry.
- [x] 2.5 Isolate activation failures by logging phase `activate`, skipping active registration, and continuing with remaining features.
- [x] 2.6 Isolate deactivation failures by logging phase `deactivate`, removing the feature from active state, and continuing with remaining features.

## 3. Progressive Runtime Error Adoption

- [x] 3.1 Identify existing registered YouTube feature error paths that are explicit user/automation failures.
- [x] 3.2 Update selected explicit runtime error paths to use `context.logger.error(error, { phase: "runtime" })` where the logger context is naturally available.
- [x] 3.3 Leave expected transient DOM absence and intentionally normal timeout flows silent unless they represent explicit user/automation failures.

## 4. Tests and Validation

- [x] 4.1 Add unit coverage for logger schema creation, URL/videoId capture, and error normalization.
- [x] 4.2 Add unit coverage for storage retention and serialized append behavior.
- [x] 4.3 Add unit coverage for registry activation/deactivation logging.
- [x] 4.4 Add unit coverage for registry activation/deactivation failure isolation semantics.
- [x] 4.5 Run the repository check command and resolve any lint, type, test, Fallow, or OpenSpec validation issues.
