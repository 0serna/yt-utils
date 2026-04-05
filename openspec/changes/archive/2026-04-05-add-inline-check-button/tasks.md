## 1. Shared trigger orchestration

- [x] 1.1 Refactor the background workflow so the browser action and runtime messages can invoke the same mark-as-seen execution path.
- [x] 1.2 Add request and response handling for the inline trigger so the caller can receive success and failure state updates.

## 2. Desktop watch-page inline button

- [x] 2.1 Add manifest wiring for a desktop YouTube content script that runs on supported watch-page surfaces.
- [x] 2.2 Implement content-script logic to detect standard desktop watch pages, locate the action row, and insert a single inline check button immediately after Like when possible.
- [x] 2.3 Add idempotent rerender and SPA-navigation handling so the inline button is restored or repositioned without duplication.

## 3. Inline state and verification

- [x] 3.1 Implement icon-only button states for idle, running, success, and failure using inline styling and accessible labels.
- [x] 3.2 Verify that the browser action still works and that the inline button triggers the same flow on a standard desktop watch page.
- [x] 3.3 Verify that the inline button stays present across desktop watch-page rerenders or client-side navigation between videos.
