## 1. Harden Ask session detection

- [x] 1.1 Update `src/features/ask-auto-open/content.ts` so a newly navigated video is not marked complete from a stale expanded Ask panel left over from the previous video.
- [x] 1.2 Keep the existing same-video manual-close behavior while continuing to retry until the current video's Ask UI is settled enough to open or no-op.

## 2. Verify SPA navigation behavior

- [x] 2.1 Manually validate Ask auto-open across YouTube SPA navigation, including a case where the previous video's Ask panel lingers during transition.
- [x] 2.2 Run `npm run check` and `npm run build` to confirm the change passes repository validation.
