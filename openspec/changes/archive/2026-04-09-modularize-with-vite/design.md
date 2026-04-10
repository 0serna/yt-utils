## Context

The extension currently has two flat files (`background.js`, `content.js`) that contain all logic for the mark-as-seen feature. This worked for one feature but becomes unwieldy with multiple features: shared YouTube DOM helpers are inlined, message types are string constants scattered across files, and there's no formal lifecycle for activating/deactivating features on page navigation.

The rename-to-yt-utils change (prerequisite) establishes the `yt-utils` / `YTUtils` naming convention. This change builds on that foundation by introducing Vite + TypeScript and a modular source structure.

Current state:
```
extension/
  manifest.json
  background.js    ← monolithic: message handling + automation
  content.js       ← monolithic: inline button + mutation observer + trigger
```

Target state:
```
src/
  background.ts          ← barrel: imports feature handlers, registers listeners
  content.ts              ← barrel: imports features, creates registry
  features/
    mark-as-seen/
      content.ts          ← Feature module: inline button logic
      background.ts       ← Feature module: automation + message handler
      types.ts             ← Feature-specific types
    (future features go here as subdirectories)
  shared/
    youtube-dom.ts        ← YouTube selector helpers, element finding
    messaging.ts           ← Typed message types and send/receive utilities
    feature-registry.ts    ← FeatureRegistry class
    types.ts               ← Shared types (Feature, NavigationEvent, etc.)
```

## Goals / Non-Goals

**Goals:**
- Introduce Vite as the bundler with MV3 Chrome extension support
- Add TypeScript with strict config
- Create the `FeatureRegistry` pattern for feature lifecycle coordination
- Migrate mark-as-seen into `src/features/mark-as-seen/`
- Extract shared utilities into `src/shared/`
- Ensure the build output in `extension/` behaves identically to the current hand-written files

**Non-Goals:**
- Adding new features (speed control is a separate change)
- Changing any runtime behavior of the mark-as-seen feature
- Adding a popup UI, settings page, or options page
- Supporting Firefox or Safari (Chrome MV3 only, for now)
- Setting up CI/CD or automated publishing to the Chrome Web Store

## Decisions

### 1. Vite with CRXJS Vite Plugin

**Decision**: Use `@crxjs/vite-plugin` for Chrome extension development.

**Alternatives considered**:
- **Plain esbuild config**: Works, but loses HMR during development and manifest management. More DIY.
- **webpack with `chrome-extension-boilerplate`**: Heavier, slower builds, more config. Vite's DX is better.
- **Rollup config**: Vite uses Rollup internally. Direct Rollup means writing more config for the same result.

**Rationale**: CRXJS handles manifest.json reference resolution, content script injection, and provides HMR for extension development. It's the most popular Vite plugin for Chrome extensions and reduces boilerplate significantly. One risk: CRXJS may lag behind Manifest V3 spec changes, but it's actively maintained and the community is active.

### 2. Manifest.json as source file

**Decision**: `extension/manifest.json` remains a source-controlled file in the manifest directory (not generated from `package.json` or a separate YAML). CRXJS reads it directly.

**Rationale**: The manifest is simple (no dynamic fields). Keeping it as-is avoids a generation step and keeps the `Load unpacked` flow working for contributors who just want to load the built extension.

### 3. FeatureRegistry pattern

**Decision**: Each feature exports an object implementing the `Feature` interface:

```typescript
interface Feature {
  name: string;
  isWatchPage?: boolean;
  activate(context: FeatureContext): void;
  deactivate(): void;
}
```

`content.ts` barrel imports all features, passes them to the `FeatureRegistry`, which:
- Listens to YouTube's SPA navigation events (`yt-navigate-finish`)
- On each navigation, calls `deactivate()` on active features, then `activate()` on features whose `isWatchPage` condition matches
- Provides a shared `FeatureContext` with references to the `MutationObserver` coordinator and message bus

**Alternatives considered**:
- **Each feature self-registers**: Features call `registry.register()` themselves. More decoupled but harder to trace registration order and enforce type contracts.
- **No registry, just barrel imports**: The current approach. Doesn't scale — adding a feature means editing the barrel file and manually wiring lifecycle.

**Rationale**: A registry gives a single place to see all features, coordinate activation order, and share context. The `Feature` interface is small enough that each feature only needs to implement `activate`/`deactivate`.

### 4. Content script as single bundle

**Decision**: Vite produces a single content script bundle from `src/content.ts`. Features are not separate content scripts injected independently (Option B from our exploration was rejected).

**Rationale**: A single bundle means features share the same JS context — they can coordinate DOM mutations, share state synchronously, and avoid async message-passing overhead between features. This was the primary reason for choosing Option A (bundler) over Option B (dynamic injection).

### 5. Output directory stays `extension/`

**Decision**: Vite outputs to `extension/`. The directory remains the path contributors select in Chrome's `Load unpacked`.

**Rationale**: Maintains continuity with the existing `extension-repository-layout` spec. Contributors who already know to point Chrome at `extension/` don't need to learn a new path.

### 6. .gitignore strategy

**Decision**: Add `extension/background.js`, `extension/content.js`, and any Vite-generated chunks to `.gitignore`. Keep `extension/manifest.json` and static assets (icons, etc.) tracked.

**Rationale**: Built files should not be in version control. The manifest and any static assets that aren't generated should stay tracked so the repo is self-contained after a build.

## Risks / Trade-offs

- **[CRXJS compatibility with MV3]** → CRXJS has had issues with Manifest V3 changes in the past. Mitigation: pin the version, test after every update, and have a fallback to plain `vite-plugin-static-copy` + manual manifest management.
- **[Build step required for local development]** → Contributors can no longer edit `extension/` files and reload. Mitigation: `npm run watch` rebuilds on changes; `npm run build` produces the loadable extension. Document this clearly in README.
- **[Source maps in production extension]** → Vite generates source maps by default. Mitigation: disable source maps in production build config to keep the extension small.
- **[FeatureRegistry complexity for two features]** → A registry is over-engineered for just mark-as-seen. Mitigation: the registry is lightweight (~50 lines) and avoids a bigger refactor later. The cost is justified by the upcoming speed-control feature.
- **[Build output doesn't match hand-written files byte-for-byte]** → Bundled code is functionally identical but has different formatting/modules. Mitigation: verify behavior through manual testing checklist, not diff comparison.
