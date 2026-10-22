# `register()` only collects features; `start()` activates them once

`FeatureRegistry.register()` accumulates features and does not sync. `start()` performs the single activation pass, and a feature registered after `start()` activates immediately. Syncing on every registration activated and deactivated all features once per registered feature, which produced about 150 log entries per page load and reset per-video state up to 15 times.

**Considered options**: deferring the sync with `queueMicrotask` inside `register()` was rejected because it hides when activation happens and breaks the immediate-activation tests.
