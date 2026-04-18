## Context

The "mark as seen" feature in `src/features/mark-as-seen/automation.ts` automates a sequence of interactions on YouTube watch pages: seek to 99%, pause, open Share dialog, enable "Start at", copy the generated URL, and redirect the tab. The goal is to make YouTube register the video as watched so the red progress bar appears on thumbnails.

Playwright investigation revealed that YouTube's server-side watch tracking relies on a `/youtubei/v1/player/heartbeat` POST request that only fires during actual video playback. When the automation seeks to 99% and immediately pauses, no heartbeat is sent, so YouTube never marks the video as watched. The intermittent "success" observed in production is likely due to the share URL redirect occasionally triggering server-side watch registration through a different code path.

## Goals / Non-Goals

**Goals:**
- Ensure the heartbeat fires reliably by playing the video briefly after seeking
- Keep the change minimal — only insert a playback step into the existing automation flow
- Maintain backward compatibility with all existing triggers (inline button, extension action)

**Non-Goals:**
- No changes to the share dialog flow, URL generation, or redirect logic
- No changes to the inline button UI or messaging layer
- No changes to error handling or timeout behavior beyond the new wait

## Decisions

### Decision: Play for a fixed duration after seeking

**Choice:** Call `video.play()` after seeking to 99%, wait ~2 seconds, then call `video.pause()`.

**Rationale:** YouTube's heartbeat fires approximately 2 seconds after playback starts, regardless of the current playback position. A fixed 2-second play is sufficient to trigger the heartbeat while minimizing user-visible delay.

**Alternatives considered:**
- *Wait for heartbeat network response*: Too complex — would require intercepting network requests from the content script, which is not feasible with `chrome.scripting.executeScript`.
- *Play until `ended` event*: Would require waiting for the full remaining 1% of the video, which could be several seconds for long videos.
- *Play for 1 second*: Risky — heartbeat timing may vary; 2 seconds provides a safety margin.

### Decision: Insert playback step between seek and pause

**Choice:** The new step goes between the existing seek-verification block and the pause block in `automation.ts`.

**Rationale:** This is the minimal insertion point. The seek must complete first (to position at 99%), then playback triggers the heartbeat, then pause stops playback before opening the share dialog.

### Decision: No heartbeat verification check

**Choice:** Do not attempt to verify that the heartbeat was actually sent. Simply play for a fixed duration and proceed.

**Rationale:** Verifying the heartbeat would require network interception, which is not available in the content-script context where the automation runs. The 2-second play duration is empirically sufficient based on Playwright testing.

## Risks / Trade-offs

- **[Risk]** Playback may be briefly visible to the user (video jumps to 99% and plays for ~2s). → **Mitigation:** The video is already paused at this point, and the 2-second playback is brief. The user is actively triggering the action, so brief visual feedback is acceptable.
- **[Risk]** Total automation time increases by ~2–3 seconds. → **Mitigation:** This is a trade-off for reliability. The previous intermittent failures were worse than a consistent 2–3 second delay.
- **[Risk]** YouTube may change heartbeat timing in the future. → **Mitigation:** The 2-second duration has a safety margin. If YouTube changes this, the fix can be adjusted.
- **[Risk]** Some videos may not support programmatic playback (e.g., age-restricted, region-locked). → **Mitigation:** The existing error handling will catch playback failures and report them to the user.
