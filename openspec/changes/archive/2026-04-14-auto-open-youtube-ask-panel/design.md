## Context

YouTube now exposes an `Ask` chat panel on some watch pages. The extension already operates as a watch-page controller and uses DOM polling plus mutation observers to keep UI automation resilient across YouTube re-renders.

The new behavior is narrow: open the `Ask` panel automatically when it is available, and avoid reopening it after the user closes it during the same video session.

## Goals / Non-Goals

**Goals:**
- Open the `Ask` panel automatically on supported YouTube watch pages.
- Detect whether the panel is already open before interacting.
- Avoid fighting the user after they manually close the panel.

**Non-Goals:**
- Do not add chat input automation or prompt generation.
- Do not persist state across browser restarts.
- Do not change behavior on non-watch pages.

## Decisions

1. Use the engagement panel state as the source of truth.
   - The `Ask` entry point maps to `ytd-engagement-panel-section-list-renderer[target-id="PAyouchat"]`.
   - `visibility="ENGAGEMENT_PANEL_VISIBILITY_HIDDEN"` means the panel is closed, and `ENGAGEMENT_PANEL_VISIBILITY_EXPANDED` means it is open.
   - Alternatives considered: reading button state (`aria-pressed` / `aria-expanded`) or inferring from the chat DOM. Those are less reliable because the button currently exposes no useful toggle state.

2. Trigger the click once per video navigation.
   - Track a per-video session marker so the panel is opened only once on load.
   - This prevents repeated clicks during DOM churn and respects a manual close.
   - Alternatives considered: continuously enforcing open state, or blindly clicking on every mutation. Both would create a hostile UX.

3. Integrate the behavior as a watch-page content feature.
   - The feature should follow the existing watch-page lifecycle used by the other utilities.
   - It should use the same reactivity style already in the extension: lightweight polling plus mutation observation.
   - Alternatives considered: background-script automation or a dedicated command path. Those add complexity without improving reliability for this page-local interaction.

4. Keep the implementation defensive and no-op when unavailable.
   - If the `Ask` panel is missing, stay silent and do nothing.
   - If YouTube changes the panel shape enough that detection fails, the feature should degrade safely.

## Risks / Trade-offs

- [YouTube may rename or restructure the panel] → Mitigate by keying off the panel target id and keeping a secondary text-based fallback.
- [The feature may race with YouTube rendering] → Mitigate with a short retry window and mutation-based rechecks.
- [Automatic opening can feel intrusive] → Mitigate by opening only once per video and never reasserting after a user closes it.
- [Language or experiment variance could change labels] → Mitigate by preferring structural state over visible copy.
