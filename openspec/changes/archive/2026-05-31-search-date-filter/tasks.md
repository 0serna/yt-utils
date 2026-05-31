## 1. Feature Module

- [x] 1.1 Create `src/features/search-date-filter/content.ts` with `Feature` interface implementation
- [x] 1.2 Implement `matchesPage` to detect `/results` with `search_query` parameter
- [x] 1.3 Implement `activate` to redirect URLs without `sp` parameter to include `sp=EgIIBQ%253D%253D`
- [x] 1.4 Implement `deactivate` as no-op

## 2. Registration

- [x] 2.1 Import `searchDateFilterFeature` in `src/content.ts`
- [x] 2.2 Register feature with `registry.register(searchDateFilterFeature)`

## 3. Testing

- [x] 3.1 Write unit tests for `matchesPage` predicate
- [x] 3.2 Write unit tests for URL redirect logic (with/without existing `sp`)
- [x] 3.3 Verify feature does not modify URLs that already have `sp` parameter
