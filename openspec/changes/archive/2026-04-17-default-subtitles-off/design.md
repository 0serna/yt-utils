## Context

The current subtitle feature polls the YouTube player state on supported watch pages, derives a desired subtitle selection from the live player snapshot, applies that selection once, and then stops reapplying it after a manual per-video subtitle or audio change. Today, that policy can choose among subtitle-off, direct English captions, and English auto-translation based on inferred audio language and available tracks.

This change simplifies only the subtitle policy. Playback-speed behavior still depends on inferred audio language, so the shared player snapshot and bridge code that expose audio-language information remain relevant outside subtitle selection.

## Goals / Non-Goals

**Goals:**
- Make every supported watch page start with subtitles off by default.
- Preserve the existing per-video manual override behavior after the initial automatic policy application.
- Remove automatic selection of direct English subtitle tracks and English auto-translation from the subtitle policy path.
- Keep the change narrow and local to the subtitle feature and shared subtitle-selection helpers.

**Non-Goals:**
- Remove audio-language inference from the codebase entirely.
- Change playback-speed initialization or any non-subtitle feature behavior.
- Add settings, prompts, or visible controls for subtitle behavior.
- Enforce subtitles off forever after page load; users may still enable subtitles manually for the current video.

## Decisions

### Keep the existing feature lifecycle and polling model
The feature already has a working activation, polling, application, verification, and per-video override flow. Reusing that flow keeps the behavioral change small and avoids touching feature lifecycle coordination.

Alternative considered: replace polling with a new event-driven subtitle observer. Rejected because the requested change is a policy simplification, not a lifecycle redesign.

### Reduce subtitle selection to a single automatic outcome: `off`
The subtitle selection helper should always resolve to the off state for automatic policy application. This removes all language-based branching and all automatic caption-track selection while keeping compatibility with the existing bridge API, matching logic, and verification flow.

Alternative considered: bypass selection helpers and call subtitle-toggle behavior directly from the feature. Rejected because it would duplicate logic already centralized in the shared player helper layer.

### Preserve manual per-video override detection exactly as a guardrail
The current feature records the applied subtitle signature and stops reapplying policy for a video once the user changes subtitle or audio behavior. That behavior should remain intact so the extension only establishes the initial default and does not fight the user afterward.

Alternative considered: continuously force subtitles off on every poll. Rejected because it conflicts with the desired behavior of allowing the user to re-enable subtitles for the current video.

### Keep player snapshot audio-language data available for other features
Although subtitle policy will no longer depend on audio language, shared player snapshot fields and bridge logic should not be removed if playback-speed still relies on them. The implementation should narrow subtitle policy without breaking other consumers of the same snapshot.

Alternative considered: remove audio-language fields from shared snapshot types as part of this change. Rejected because that would expand the change scope into unrelated playback-speed behavior.

## Risks / Trade-offs

- [Shared helpers currently bundle subtitle policy concepts together] -> Mitigation: keep the change focused on subtitle selection behavior and avoid removing shared fields still used elsewhere.
- [Users who relied on automatic English subtitles for non-English audio will lose that convenience] -> Mitigation: make the behavior explicit in the proposal and spec so the change is intentional and testable.
- [Polling could still treat some YouTube-driven subtitle state changes as manual overrides] -> Mitigation: preserve the current override model in this change and leave deeper override-detection refinement out of scope.

## Migration Plan

1. Update the subtitle-policy spec to replace language-based auto-selection with universal default-off behavior.
2. Simplify subtitle selection logic so automatic application only targets subtitles-off.
3. Verify representative watch pages start with subtitles off and still allow manual user enablement afterward.
4. Roll back, if needed, by restoring the prior language-based selection rules in the subtitle helper and feature tests.

## Open Questions

None at proposal time.
