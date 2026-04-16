## Context

The extension is currently structured around YouTube-only content behavior. `manifest.json` injects content scripts only on YouTube hosts, and `src/content.ts` boots a `FeatureRegistry` whose lifecycle is tied to YouTube watch-page navigation. The proposed selection search behavior is fundamentally different: it is page-agnostic, event-driven, and must respond to text selection on arbitrary webpages rather than a known page type.

The feature also changes the extension's permission posture. To show an inline action on arbitrary sites, the extension must run a content script broadly enough to observe user selections outside YouTube. This is a user-visible trust boundary change even though the UI itself is small.

## Goals / Non-Goals

**Goals:**
- Add a browser-wide selection-search capability without destabilizing the existing YouTube features.
- Show a floating Google-search action immediately after a supported non-empty selection is made.
- Support both document text selections and selections inside `input`/`textarea` controls.
- Open the Google search in a new tab through the background service worker.
- Keep the feature self-contained so future non-YouTube features do not have to depend on YouTube-specific abstractions.

**Non-Goals:**
- Rework the existing YouTube `FeatureRegistry` into a generic extension-wide framework.
- Support special editing surfaces such as Google Docs, PDFs, browser-internal pages, or cross-origin iframe content in this change.
- Add settings, provider choice, or alternate search engines in v1.
- Rename the extension or redesign unrelated action-button surfaces.

## Decisions

### Decision: Use a separate global content entrypoint instead of the YouTube feature registry
The change will add a new content-script path dedicated to generic webpage selection behavior rather than attempting to register the feature through `FeatureRegistry`.

Rationale:
- The existing registry is explicitly keyed to YouTube watch-page lifecycle and SPA navigation.
- A global selection feature is driven by DOM selection and focus events, not page classification.
- Keeping the new capability separate minimizes risk to current YouTube-only behavior.

Alternatives considered:
- Extend `FeatureRegistry` to support non-YouTube predicates. Rejected because it would blur a currently clear abstraction and force a more architectural refactor than this feature needs.
- Put the logic directly into the existing `src/content.ts` barrel. Rejected because it would mix global and YouTube-specific bootstrapping concerns in one file.

### Decision: Detect supported selections from both document selection and active text controls
The feature will treat two selection sources as supported:
- `window.getSelection()` for ordinary page text
- `selectionStart`/`selectionEnd` on the focused `HTMLInputElement` or `HTMLTextAreaElement`

Rationale:
- This matches the desired product scope of working for normal page text and form fields.
- It covers the most common and reliable selection APIs available to content scripts.

Alternatives considered:
- Support document selections only. Rejected because it excludes common lookup flows in search boxes, forms, and editors.
- Support every editable surface including `contenteditable`, canvas editors, and rich document apps. Rejected for v1 because behavior and geometry are inconsistent across sites.

### Decision: Anchor the floating icon near the selection using source-specific geometry
For document selections, the UI will anchor to the selection range bounding rect. For text controls, it will anchor to the control's bounding rect rather than attempting exact caret geometry.

Rationale:
- Range geometry is reliable for standard page text.
- Exact caret measurement inside `input`/`textarea` is possible but disproportionately complex for a small v1 control.
- Anchoring to the control still communicates the action clearly and keeps implementation predictable.

Alternatives considered:
- Compute precise caret coordinates in controls. Rejected for v1 because it adds complexity and browser-specific edge cases without changing the core workflow.
- Render a fixed-position corner action. Rejected because it weakens the connection between the action and the selected text.

### Decision: Keep search-tab creation in the background worker
The content script will send a narrow message containing the selected query, and the background script will create the new tab.

Rationale:
- This follows the existing extension pattern of centralizing privileged tab actions in the background worker.
- It keeps the content surface focused on detection and UI only.

Alternatives considered:
- Open the tab directly from the content script. Rejected because the project already has a background/message pattern for privileged operations and it is cleaner to keep that boundary.

### Decision: Expand content-script coverage with broad webpage matches while accepting browser exclusions
The manifest will be expanded so the new selection script runs on ordinary webpages where Chrome allows content scripts, while existing YouTube scripts remain in place for YouTube-specific features.

Rationale:
- The feature cannot be truly immediate on arbitrary sites without broad injection scope.
- Chrome already excludes restricted surfaces such as `chrome://` pages, extension pages, the Chrome Web Store, and certain embedded contexts.

Alternatives considered:
- Request site access one domain at a time. Rejected for this change because the desired behavior is immediate and universal rather than opt-in per site.
- Rely on the extension action or context menu instead of inline UI. Rejected because it changes the product interaction away from the requested inline affordance.

## Risks / Trade-offs

- [Broader host permissions increase user trust sensitivity] -> Keep the new capability narrowly scoped, document the broader access in the proposal/README, and avoid reading more page state than the active selection.
- [Inline UI may feel jumpy during selection updates] -> Reconcile selection state on selection-finalizing events and coalesce DOM updates so the icon appears immediately but not redundantly.
- [Input and textarea positioning is less precise than range-based positioning] -> Accept element-anchored placement in v1 and reserve caret-precise placement for a later improvement if needed.
- [Some websites use custom editors that do not expose standard selections] -> Explicitly treat those surfaces as unsupported for this change.
- [Global DOM listeners can leak UI if cleanup is weak] -> Keep the feature self-contained with a single controller that owns event binding, floating UI lifecycle, and teardown.

## Migration Plan

1. Expand the manifest and content-script entrypoints so the new global selection feature can load on supported webpages.
2. Add the new background message handler and content feature module.
3. Update README language to reflect the broader scope and any permission implications.
4. Validate that existing YouTube behavior still loads only through the existing YouTube content path.

Rollback strategy:
- Remove the global content-script registration and message handler, then rebuild the extension to return to the current YouTube-only behavior.

## Open Questions

- Should future versions support `contenteditable` selections, or should those remain explicitly unsupported unless a site-specific need appears?
- Should the floating icon stay visually identical across all sites, or will we eventually need a lighter theme adaptation for dark/light page backgrounds?
