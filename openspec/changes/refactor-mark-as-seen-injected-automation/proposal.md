## Why

The mark-as-seen automation currently uses `chrome.scripting.executeScript({ func })`, which forces the injected function to duplicate helpers because it cannot rely on normal module imports. Moving execution into the content script messaging path removes that structural duplication and makes the automation easier to maintain.

## What Changes

- Replace function-body injection for mark-as-seen automation with a content-script message flow.
- Allow the automation implementation to use normal shared imports for waiting, errors, and DOM/player helpers.
- Preserve extension action and inline button behavior, status reporting, and unsupported-page handling.
- Remove duplicated helper code that existed only to support serialized function injection.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `youtube-watch-marking-extension`: Change the internal automation execution path from background-injected function execution to content-script message handling while preserving user-visible behavior.

## Impact

- Affects mark-as-seen background, content, automation, messaging, and shared helper usage.
- Requires runtime validation because the content script must be available before the background can request automation.
- Reduces duplicate code needed for Fallow duplicate-code enforcement.
