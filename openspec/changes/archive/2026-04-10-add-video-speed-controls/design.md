## Context

The extension already injects desktop-only watch-page UI through a content feature that survives YouTube SPA navigation and action-row rerenders. That existing pattern is a strong fit for playback-speed controls because the requested UX is another visible inline control in the same watch-page action row rather than a popup, overlay, or browser-action flow.

This change adds a global playback-speed preference that users can adjust in `0.1` increments from the watch page itself. The current tab must reflect changes immediately, future supported videos must inherit the last saved value, and already-open tabs must not live-sync when some other tab changes the preference.

## Goals / Non-Goals

**Goals:**

- Add a desktop-only inline playback-speed control to standard `www.youtube.com/watch` pages.
- Display a visible `- value +` control in the watch-page action row near the existing inline action area.
- Apply the selected speed immediately to the current page's `HTMLVideoElement`.
- Persist the most recent speed locally as the default for future supported videos and future tabs.
- Reapply the saved speed automatically when a supported watch page is loaded or navigated to in a tab.
- Avoid synchronizing playback-speed changes into tabs that were already initialized with an older value.

**Non-Goals:**

- Supporting `m.youtube.com`, Shorts, embeds, or other non-standard YouTube surfaces.
- Adding a popup, settings page, toast system, or keyboard shortcut workflow for speed control.
- Synchronizing playback speed live across already-open tabs.
- Replacing or modifying YouTube's native settings menu.

## Decisions

### Add playback speed as a second watch-page content feature

The extension will register a new watch-page content feature dedicated to playback speed instead of merging the new UI into the existing mark-as-seen feature.

This keeps each feature focused: one owns mark-as-seen triggering and one owns playback-speed state, storage, and application. It also fits the current `FeatureRegistry` model, which already activates multiple watch-page features.

Alternative considered: extending the existing mark-as-seen content feature with speed-control responsibilities. Rejected because it would couple unrelated UI and state lifecycles inside a single large content module.

### Render the control inline in the desktop action row with visible value text

The speed control will be inserted into the same desktop watch-page action row used by the current inline button and will render as decrement button, current text value, and increment button.

This matches the requested visible UX, keeps the control discoverable, and avoids obscuring the player with overlays. The value text is part of the control, not secondary metadata, because users need to see the active speed at a glance.

Alternative considered: overlaying controls on the player. Rejected because it adds visual noise and does not match the established inline action-row pattern in this repository.

### Persist the last user-selected speed in extension-local storage

The extension will treat playback speed as a locally persisted global preference. Whenever the user changes speed in a supported watch page, that value becomes the new saved default for future watch-page initializations.

This matches the requested mental model: the latest change wins globally, but only for future tabs or future watch-page navigations.

Alternative considered: storing speed only in memory per tab. Rejected because it would lose the requested global persistence across future videos and browser sessions.

### Snapshot the saved default when a tab initializes, without live tab synchronization

Each supported watch page will read the saved default during its own activation and use that as its local starting state. Later changes from another tab will update storage for future pages but will not push updates into already-open tabs.

This preserves the user's stated behavior model and avoids adding storage listeners or cross-tab coordination logic.

Alternative considered: listening for storage changes and updating all open watch tabs. Rejected because it would violate the requested non-synchronized tab behavior.

### Apply speed directly through `HTMLVideoElement.playbackRate`

The content feature will update the current page by setting `video.playbackRate` directly on the active YouTube video element and will reapply the selected value when a new watch-page video becomes available.

This is the smallest implementation surface, avoids trying to drive YouTube's native settings UI, and should keep captions and playback timing aligned through the browser media element itself.

Alternative considered: automating YouTube's native playback-speed menu. Rejected because it is more brittle, more DOM-dependent, and unnecessary for the requested functionality.

### Clamp the control to fixed bounds and disable invalid actions

The control will use `0.1` steps with a minimum of `0.5x`, a maximum of `2.0x`, and a default of `1.0x`. When the current value reaches a bound, the corresponding decrement or increment button will be disabled.

This gives predictable interaction, avoids invalid floating-point drift beyond supported values, and makes the edge behavior explicit in the UI.

Alternative considered: allowing free-form numeric input. Rejected because it complicates validation and is less convenient for the requested repeated small adjustments.

## Risks / Trade-offs

- [YouTube rerenders or replaces the action row after control insertion] -> Use the same idempotent watch-page observation pattern as the existing inline feature and ensure only one speed-control host exists per page.
- [A new video element appears after client-side navigation] -> Re-run playback-rate application when watch-page activation changes or when the target video element becomes available.
- [Storage reads are briefly unavailable or delayed] -> Fall back to a default speed for the current page and update the inline UI once the stored value is resolved.
- [Floating-point steps produce inconsistent labels like `1.2000000001`] -> Normalize values to one decimal place before rendering, comparing bounds, saving, and applying.
- [The action row becomes crowded with multiple extension controls] -> Keep the UI compact and aligned with the existing inline-button styling rather than introducing a larger composite widget.

## Migration Plan

1. Add a new watch-page content feature for playback-speed controls and register it alongside the existing mark-as-seen feature.
2. Add local storage read/write helpers for the saved global playback-speed preference.
3. Implement action-row rendering, bound-aware `- / +` interactions, and immediate `video.playbackRate` updates for the current page.
4. Reapply the saved speed during supported watch-page activation and verify that same-tab navigation inherits the latest stored value.
5. Verify that already-open tabs do not change automatically when another tab saves a different speed.

Rollback is straightforward: remove the playback-speed feature registration and storage wiring while leaving the existing mark-as-seen functionality unchanged.

## Open Questions

None.
