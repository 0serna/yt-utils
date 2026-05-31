## Context

The yt-utils extension uses a `FeatureRegistry` pattern where each feature declares a `matchesPage` predicate and `activate`/`deactivate` lifecycle methods. The registry listens for YouTube SPA navigation events (`yt-navigate-start`, `yt-navigate-finish`, `yt-page-data-updated`) and polls every 500ms to sync feature state with the current URL.

YouTube search URLs follow the pattern `/results?search_query=<query>&sp=<base64-protobuf>`. The `sp` parameter encodes search filters as a protobuf message. For time filters, the structure is `12 02 08 XX` where `XX` is the filter ID (5 = Last year).

## Goals / Non-Goals

**Goals:**

- Automatically apply "Last year" filter to YouTube searches that have no existing filter
- Follow existing feature patterns for consistency
- Keep implementation minimal and surgical

**Non-Goals:**

- Configurable filter selection (future enhancement)
- Intercepting form submission before navigation (complexity not justified)
- Mobile YouTube support (extension is Chrome desktop only)

## Decisions

### Decision 1: Navigation interception over form interception

**Choice**: Detect search URLs without `sp` parameter and redirect with the filter appended.

**Rationale**: The FeatureRegistry already handles navigation events. Intercepting the search form would require finding YouTube's shadow DOM elements and handling custom events, which is fragile and tightly coupled to YouTube's internal implementation.

**Alternatives considered**:

- Form submission interception: Would prevent flash of unfiltered results but requires complex DOM interaction with YouTube's search bar
- MutationObserver on search input: Fragile, depends on YouTube's internal markup

### Decision 2: Respect existing filters

**Choice**: Only add `sp` parameter when no `sp` exists in the URL.

**Rationale**: Users who manually apply filters have made an explicit choice. Overriding would be invasive and break expected behavior. The check is simple: `url.searchParams.has('sp')`.

### Decision 3: Hardcoded filter value

**Choice**: Use constant `LAST_YEAR_SP = 'EgIIBQ%253D%253D'`.

**Rationale**: The user confirmed only "Last year" is needed. Hardcoding eliminates configuration complexity. The URL-encoded value includes double-encoding (`%253D` = `%3D` = `=`) to match YouTube's URL format.

### Decision 4: Feature lifecycle

**Choice**: Feature activates on search pages, does nothing in `deactivate`.

**Rationale**: The redirect is a one-time action per search. Once the URL has the filter, the feature has no ongoing work. `deactivate` is a no-op, consistent with `auto-switch-to-videos-tab`.

## Risks / Trade-offs

- **Flash of unfiltered results**: When the feature redirects, YouTube may briefly show unfiltered results before the new URL loads. This is acceptable because it only happens once per search and the redirect is fast.
- **YouTube URL format changes**: If YouTube changes the `sp` encoding or filter values, the hardcoded constant will need updating. Low risk — protobuf encoding is stable.
- **FeatureRegistry polling delay**: The 500ms poll interval means the redirect may have a small delay. The navigation event listeners (`yt-navigate-start` etc.) should trigger faster in practice.
