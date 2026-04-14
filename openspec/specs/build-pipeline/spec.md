# build-pipeline Specification

## Purpose
Define the Vite build pipeline that produces a loadable Chrome extension from the source tree.

## Requirements
### Requirement: Vite build produces a loadable Chrome extension
The project SHALL use Vite with `@crxjs/vite-plugin` to compile the `src/` directory into a Manifest V3 Chrome extension in the `extension/` directory. The build output SHALL be directly loadable via Chrome's `Load unpacked` flow.

#### Scenario: Production build
- **WHEN** a contributor runs `npm run build`
- **THEN** Vite compiles all TypeScript source files and outputs a working Chrome extension into `extension/`, ready to be loaded by Chrome

### Requirement: Validation passes with Biome and TypeScript
The project SHALL use TypeScript with `strict: true` in `tsconfig.json`. All source files in `src/` SHALL pass the repository validation command without errors.

#### Scenario: Validation passes
- **WHEN** a contributor runs `npm run check`
- **THEN** Biome reports no issues and the TypeScript compiler reports no type errors across all source files in `src/`

### Requirement: Manifest remains source-controlled
The `extension/manifest.json` file SHALL be a source-controlled file read by CRXJS, not a generated artifact. It SHALL reference source entry points that CRXJS resolves at build time.

#### Scenario: Manifest references source entry points
- **WHEN** Vite builds the extension
- **THEN** CRXJS reads `extension/manifest.json` and resolves the `background.service_worker` and `content_scripts[].js` entry points from the Vite build output

### Requirement: Build output is gitignored
Generated JavaScript files and source maps in `extension/` SHALL be excluded from version control via `.gitignore`. Only `extension/manifest.json` and any static assets SHALL remain tracked.

#### Scenario: git status after build
- **WHEN** a contributor runs `npm run build` and then `git status`
- **THEN** git does not report changes to `extension/background.js`, `extension/content.js`, or other generated files
