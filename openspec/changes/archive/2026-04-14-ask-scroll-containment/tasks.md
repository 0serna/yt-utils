## 1. Containment Wiring

- [x] 1.1 Extend the `ask-auto-open` feature to target the `Ask` panel scroll container.
- [x] 1.2 Apply scroll containment so wheel and touch scrolling stay inside the panel.

## 2. DOM Resilience

- [x] 2.1 Reapply containment when YouTube rerenders the `Ask` panel or its scroll container.
- [x] 2.2 Keep the behavior scoped to the `Ask` panel and avoid changing normal page scrolling elsewhere.

## 3. Verification

- [x] 3.1 Validate that scrolling at the top or bottom of `Ask` no longer scrolls the page behind it.
- [x] 3.2 Validate that the page still scrolls normally when `Ask` is unavailable.
- [x] 3.3 Run the repo checks relevant to the touched files and fix any regressions.
