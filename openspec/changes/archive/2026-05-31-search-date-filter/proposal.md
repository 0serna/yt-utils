## Why

YouTube search results often include outdated content from years ago. Users performing searches want recent results but must manually apply the "Last year" filter each time. This feature automates that filter application, improving search relevance without user intervention.

## What Changes

- New content-script feature `search-date-filter` that intercepts YouTube search navigations
- Automatically redirects `/results` URLs without a `sp` parameter to include `sp=EgIIBQ%253D%253D` (Last year filter)
- Respects existing `sp` parameters — if the user has already applied a filter, the feature does not modify the URL
- Feature is always active on search results pages, no toggle required

## Capabilities

### New Capabilities

- `search-date-filter`: Content-script feature that detects YouTube search results pages and automatically adds the "Last year" time filter when no filter is already present

### Modified Capabilities

- `feature-registry`: No requirement changes — the new feature follows existing registration patterns

## Impact

- New file: `src/features/search-date-filter/content.ts`
- Modified: `src/content.ts` (register the new feature)
- No new dependencies
- No breaking changes
- Minimal flash of unfiltered results before redirect (acceptable tradeoff for implementation simplicity)
