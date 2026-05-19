## Repository Structure

```text
.
├── src/                  # TypeScript extension source
│   ├── features/         # feature modules with content/background logic
│   ├── main-world/       # MAIN-world YouTube player bridge scripts
│   ├── shared/           # shared helpers, messaging, and types
│   ├── background.ts     # extension service worker entrypoint
│   ├── content.ts        # YouTube content-script entrypoint
│   └── global-selection.ts # all-pages text selection content script
├── openspec/             # specs, changes, and validation
├── scripts/              # local automation (check.sh)
└── extension/            # build output (generated)
```

## Repository Commands

- `npm install`: install dependencies.
- `npm run build`: build the extension with Vite.
- `npm test`: run tests with Vitest (coverage via Istanbul).
- `npm run check`: run ESLint, TypeScript, Fallow, and OpenSpec validation.
- `npm run format`: format files with Prettier.

## Workflow

- Use `playwriter` to explore and analyze web pages.
- When you need to validate the extension, you can run `npm run build` and ask the user (`question` tool) to reload the extension.
