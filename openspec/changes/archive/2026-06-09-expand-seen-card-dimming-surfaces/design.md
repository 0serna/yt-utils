## Context

The current `seen-card-dimming` feature activates only on `www.youtube.com/feed/subscriptions`, scans `ytd-rich-item-renderer` cards, detects YouTube's native watched progress segment, and applies inline `opacity: 0.4` to the card's `yt-lockup-view-model` when progress is at least 80%. The same YouTube lockup/progress structure also appears on other desktop surfaces, including channel video tabs such as `/@rachelsenglish/videos`, but the feature never activates there.

The expanded behavior should keep the feature cosmetic and DOM-driven. It should not query YouTube history, persist watched state, or infer seen status without YouTube's native progress indicator.

## Goals / Non-Goals

**Goals:**

- Run watched-card dimming across desktop `www.youtube.com` list surfaces, including home, subscriptions, channel video tabs, search, playlists, and watch-page recommendations.
- Treat a video as seen only when YouTube's native progress indicator reports at least 90% progress.
- Keep the opacity target limited to `yt-lockup-view-model` so unsupported card structures remain unchanged.
- Exclude Shorts everywhere.
- Restore only dimming applied by this extension when the feature deactivates.

**Non-Goals:**

- Supporting `m.youtube.com`, embeds, or non-YouTube pages.
- Supporting card structures that do not contain `yt-lockup-view-model`.
- Replacing YouTube's native progress indicator with history scraping, storage, APIs, or custom watched-state inference.
- Changing the visual opacity value.

## Decisions

### Match desktop YouTube broadly, then filter by card structure

The feature should activate on `www.youtube.com` pages instead of only `/feed/subscriptions`, then scan for eligible video card roots that contain both a native watched-progress segment and a `yt-lockup-view-model` target. This keeps URL matching simple and lets DOM eligibility decide whether a page actually contains dimmable cards.

Alternative considered: enumerate every supported YouTube path. Rejected because YouTube surfaces and URL shapes change frequently, while the desired behavior is tied to rendered video list cards rather than a fixed route list.

### Keep `yt-lockup-view-model` as the only dimming target

The feature should continue applying opacity to `yt-lockup-view-model` and skip cards without that wrapper. This preserves the current full-card visual treatment where supported and avoids fragile renderer-specific opacity targets.

Alternative considered: dim renderer containers such as `ytd-rich-item-renderer`, `ytd-compact-video-renderer`, or thumbnails. Rejected because it would require broader per-surface styling choices and could affect layout or controls differently across YouTube experiments.

### Use a 90% native-progress threshold

The watched detector should continue parsing YouTube's watched progress segment width, but the threshold should change from 80% to 90%. This makes dimming represent near-complete viewing and avoids de-emphasizing videos that were only substantially, but not fully, watched.

Alternative considered: add additional watched-state signals. Rejected because the current native-progress heuristic is observable, simple, and avoids user-history or account-data coupling.

### Mark extension-owned dimming

When applying opacity, the feature should also set an extension-owned marker attribute on the dimmed `yt-lockup-view-model`. Deactivation should clear opacity only from elements carrying that marker and remove the marker. This avoids deleting unrelated inline opacity from YouTube or another extension.

Alternative considered: keep using non-empty `style.opacity` as the ownership sentinel. Rejected because broad activation increases the chance of encountering unrelated inline opacity.

## Risks / Trade-offs

- [YouTube changes class names for the progress segment] → The feature will stop detecting watched cards until selectors are updated; this matches the current dependency on YouTube's native DOM.
- [Some desktop surfaces use video cards without `yt-lockup-view-model`] → Those cards will not dim; this is an intentional compatibility trade-off to avoid fragile fallback targets.
- [Broad `www.youtube.com` activation observes more DOM mutations] → Keep mutation filtering and requestAnimationFrame batching so rescans occur only for relevant card/progress changes.
- [Shorts detection may miss a new Shorts renderer shape] → Preserve existing Shorts checks and expand only when concrete new DOM evidence appears.
