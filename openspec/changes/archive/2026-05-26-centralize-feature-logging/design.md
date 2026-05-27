## Context

Registered YouTube features share a common lifecycle through `FeatureRegistry`, but logging is currently ad hoc. Some runtime errors are sent to `console.error`, several expected failure paths are silent, and activation/deactivation is not recorded. The extension already has the `storage` permission, making `chrome.storage.local` available from content scripts without introducing a service-worker persistence layer.

The initial logging scope is limited to features registered through `src/content.ts` and coordinated by `FeatureRegistry`. The global all-pages selection content script and background-only flows are excluded from this change.

## Goals / Non-Goals

**Goals:**

- Persist structured JSON lifecycle logs for all registered YouTube features.
- Provide a stable `chrome.storage.local` key that an external agent can read.
- Keep log storage bounded to the latest 1000 entries.
- Centralize activation/deactivation logging in `FeatureRegistry`.
- Inject a standard logger in `FeatureContext` for progressive runtime error logging.
- Isolate activation/deactivation failures so one feature does not block others.

**Non-Goals:**

- Writing logs directly to a filesystem path.
- Adding native messaging, a local server, or new browser permissions.
- Instrumenting `global-selection-search` or background-only handlers.
- Converting every existing silent catch into a runtime log in the initial change.
- Adding a UI for viewing, exporting, or clearing logs.

## Decisions

### Store logs in `chrome.storage.local`

Use a single storage key, `yt-utils:logs`, containing a chronological array of log entries. This is simpler than introducing IndexedDB and is sufficient for the selected retention limit.

Alternatives considered:

- IndexedDB in the service worker: better append semantics and scale, but requires additional messaging and a more complex persistence layer.
- Download/export files: creates a real file for agents, but is noisier and less suitable as the primary always-available log store.

### Keep a bounded array of the latest 1000 entries

Each write appends new entries and truncates the array to the latest 1000 items. This avoids unbounded storage growth and keeps reads simple for agents.

Alternatives considered:

- Time-based retention: semantically useful but more complex and less predictable in storage size.
- Per-feature keys: easier per-feature filtering but loses a simple global chronological stream.

### Use a minimal structured schema

Each entry contains `timestamp`, `feature`, `event`, `url`, optional `videoId`, optional `phase`, and optional normalized `error` details. Error stack traces are preserved when available.

No `sessionId`, `source`, or extension version is included initially to keep the contract minimal.

### Centralize lifecycle logging in `FeatureRegistry`

The registry is the authoritative lifecycle coordinator. It will create a feature-specific logger, pass it through `FeatureContext`, and record successful activation/deactivation.

Activation failure behavior:

- log `event: "error"`, `phase: "activate"`
- do not add the feature to `activeFeatures`
- continue activating subsequent matching features

Deactivation failure behavior:

- log `event: "error"`, `phase: "deactivate"`
- remove the feature from `activeFeatures`
- do not log a successful `deactivation` event
- continue deactivating remaining features

### Expose a small feature logger API

`FeatureContext` will include a logger with:

- `activation()`
- `deactivation()`
- `error(error, meta?)`

The registry will use lifecycle methods automatically. Individual features can progressively use `logger.error(error, { phase: "runtime", ... })` for explicit runtime failures.

### Mirror only errors to the console

Normal lifecycle events are persisted only to storage. Logged errors are persisted and mirrored to `console.error` to preserve immediate DevTools visibility without creating lifecycle noise.

## Risks / Trade-offs

- `chrome.storage.local` updates are not true append operations → use a serialized write queue in the logger utility so concurrent lifecycle events do not overwrite each other.
- Runtime errors inside timers, observers, and asynchronous handlers are not automatically captured → expose `context.logger` so features can adopt runtime logging incrementally.
- Logs contain full URLs and may reveal browsing context → retain only the latest 1000 entries and keep the scope limited to registered YouTube features.
- A storage write may fail or be unavailable in tests → logger calls should be fire-and-forget from feature lifecycle paths and must not break feature behavior.
