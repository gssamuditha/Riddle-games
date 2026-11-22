# Contributing to The Archive of Impossible Trials

Thank you for contributing to this interactive anthology of classic logic riddles!

## Development Setup

```bash
npm install
npm run dev
```

Before opening a pull request, make sure tests and production builds pass cleanly:

```bash
npm test
npm run build
```

## Architecture Guidelines

Every riddle chapter lives in its own isolated folder under `src/games/<riddle-slug>/` and follows a strict separation between **logic** and **presentation**:

1. **`engine.ts`** — Pure, framework-free TypeScript state machine (no React imports, immutable transitions, deterministic rules, and an exact solver/analyzer whenever feasible).
2. **`engine.test.ts`** — Vitest unit tests verifying optimal solutions, edge cases, invalid moves, undo behavior, and solver accuracy.
3. **`story.ts`** — Narrative prologue, concise rules, progressive 3-tier hints, and contextual dialogue lines.
4. **`<Riddle>Scene.tsx`** — Responsive SVG/Framer Motion visual stage supporting both Dark Mode and Light Mode (`theme: 'dark' | 'light'`).
5. **`<Riddle>Game.tsx` + Modals** — Clean, distraction-free UI matching the anthology's visual restraint (single top bar, full-focus stage, single action dock, glass popovers).

## Adding a New Chapter

1. Add the chapter's union ID in `src/core/types.ts`.
2. Register chapter metadata in `src/core/catalog.ts`.
3. Create `src/games/<chapter-id>/` with the files above.
4. Add miniature preview artwork in `src/components/AnthologyHub.tsx` and wire the route in `src/App.tsx`.
5. Run `npm test && npm run build` to verify everything compiles and passes.

