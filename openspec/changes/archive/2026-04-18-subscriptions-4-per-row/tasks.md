## 1. Create Feature Module

- [x] 1.1 Create directory `src/features/subscriptions-grid-density/`
- [x] 1.2 Create `src/features/subscriptions-grid-density/content.ts` with Feature implementation
- [x] 1.3 Implement `matchesPage()` using `isDesktopSubscriptionsFeedPage()` helper
- [x] 1.4 Implement `activate()` to inject CSS stylesheet
- [x] 1.5 Implement `deactivate()` to remove injected stylesheet
- [x] 1.6 Define CSS content: reduce `ytd-rich-item-renderer` width to 400px, remove container max-width constraints

## 2. Register Feature

- [x] 2.1 Import new feature in `src/content.ts`
- [x] 2.2 Register feature with `registry.register()` in the appropriate order

## 3. Build and Test

- [x] 3.1 Run `npm run build` to verify no TypeScript errors
- [x] 3.2 Run `npm run check` to pass linting and type checks
- [x] 3.3 Load extension in Chrome and verify feature activates on subscriptions page
- [x] 3.4 Confirm 4 videos display per row with proper thumbnail aspect ratios
- [x] 3.5 Navigate away and back to verify cleanup and reactivation
- [x] 3.6 Test with infinite scroll to ensure new cards get styled
