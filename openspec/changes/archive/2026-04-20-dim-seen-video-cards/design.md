## Context

The `subscriptions-seen-overlay` feature currently injects a dark overlay div (`rgba(0, 0, 0, 0.6)`) after the `.ytThumbnailViewModelImage` container inside each `yt-thumbnail-view-model`. This only dims the thumbnail image, not the title, channel name, or other metadata. The feature uses a `MutationObserver` to detect new cards and a "seen" detection heuristic based on YouTube's native progress bar (80%+ width = seen).

The DOM structure of a subscription card:

```
ytd-rich-item-renderer
  └── yt-lockup-view-model          ← target for card-level opacity
      ├── a (thumbnail link)
      │   └── yt-thumbnail-view-model
      │       └── .ytThumbnailViewModelImage  ← current overlay target
      └── .ytLockupViewModelMetadata (title, channel, views)
```

## Goals / Non-Goals

**Goals:**

- Apply CSS `opacity: 0.4` to the entire `yt-lockup-view-model` element for seen videos
- Remove the thumbnail-only overlay injection logic entirely
- Keep the same "seen" detection heuristic (80%+ progress bar width)
- Maintain MutationObserver-based dynamic content handling
- Keep feature scoped to subscriptions feed only

**Non-Goals:**

- No hover restoration effect
- No CSS transition animation
- No expansion to other YouTube pages (home, search, channel)
- No changes to the "seen" detection threshold or logic
- No changes to the mark-as-seen feature

## Decisions

### 1. Target `yt-lockup-view-model` instead of `ytd-rich-item-renderer`

**Decision**: Apply opacity to `yt-lockup-view-model` (the card content wrapper) rather than the outer `ytd-rich-item-renderer`.

**Rationale**: `yt-lockup-view-model` contains exactly the visual content (thumbnail + metadata) without affecting any layout or spacing that `ytd-rich-item-renderer` might control. This minimizes risk of breaking the grid layout.

**Alternatives considered**:

- `ytd-rich-item-renderer`: Could affect grid spacing or margins
- Individual elements (thumbnail + metadata separately): More complex, defeats the "single line" simplicity goal

### 2. Use inline CSS `opacity` instead of a class-based approach

**Decision**: Apply `opacity: 0.4` via `Object.assign(cardLockup.style, { opacity: "0.4" })` rather than injecting a CSS class.

**Rationale**: Consistent with the existing codebase pattern (current overlay uses inline styles). No need to manage a separate stylesheet or class injection. Simpler removal (just set `opacity: ""`).

### 3. Replace overlay injection with direct style application

**Decision**: Instead of creating a child overlay div, apply opacity directly to the `yt-lockup-view-model` element. Remove `OVERLAY_CLASS`, `injectOverlay()`, and `removeAllOverlays()` in favor of `applyDimming()` and `removeAllDimming()`.

**Rationale**: Eliminates DOM manipulation complexity (creating/removing overlay elements). A single style property is simpler to manage than a child element.

### 4. Use `yt-lockup-view-model` as the dimming sentinel

**Decision**: Check for existing dimming by testing if `yt-lockup-view-model` already has `style.opacity` set, rather than querying for an overlay class.

**Rationale**: No overlay element means no class to query. The opacity style itself becomes the sentinel.

## Risks / Trade-offs

| Risk                                                                     | Mitigation                                                                                |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| YouTube DOM structure changes (`yt-lockup-view-model` selector breaks)   | Same risk exists for current selectors; feature will silently skip cards that don't match |
| `opacity` interacts with YouTube's touch-feedback hover effects          | Acceptable trade-off; hover effects will still work but on a dimmed card                  |
| `opacity` affects child element interactivity (clicks, links)            | `opacity` does not affect pointer events; links remain clickable                          |
| Unseen videos that later become seen won't auto-dim without page refresh | MutationObserver already handles new cards; existing cards are re-scanned on DOM changes  |
