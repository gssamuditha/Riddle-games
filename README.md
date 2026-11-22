# The Archive of Impossible Trials

An interactive web anthology that reimagines timeless logic and probability paradoxes as minimalist, story-driven escape games—built with pure TypeScript state engines, custom vector animations, procedural Web Audio sound effects, and adaptive Dark & Light themes.

## Playable Chapters

| Chapter | Title | Classic Riddle | Challenge & Mechanics |
| :--- | :--- | :--- | :--- |
| **Chapter I** | **The Lantern Bridge** | Bridge & Torch Riddle | Guide 4 travelers (`1m`, `2m`, `5m`, `10m`) across a crumbling gorge with one lantern in **17 minutes**; includes a live Dijkstra solver. |
| **Chapter II** | **The Midnight Ferry** | Wolf, Goat & Cabbage | Ferry 3 conflicting offerings across Mistwater Crossing one passenger at a time (**Par: 7 trips**); includes a live BFS solver. |
| **Chapter III** | **The Alchemist’s Jugs** | 3L & 5L Water Jug Puzzle | Measure exactly **4L** of Starlight Elixir using two unmarked crystal flasks (**Par: 6 steps**); includes fluid pouring animations & BFS solver. |
| **Chapter IV** | **The Three Vault Doors** | Monty Hall Paradox | Collect **6 Astral Keys** within 10 rounds with live Stay vs. Switch telemetry and an interactive **100-trial probability simulator**. |
| **Chapter V** | **The Penniless Pilgrim** | The Penniless Pilgrim Riddle | Navigate the 4×4 street grid of Duonia (`E +2`, `W −2`, `S ×2`, `N ÷2`) without repeating a street to reach the SE Temple at **0 tax** (Par: 20 steps). |
| **Chapter VI** | **The Belltower Eggs** | The 2-Egg Drop Riddle | Pinpoint the exact highest safe floor of a 100-floor belltower with **2 crystal eggs** in at most **14 drops**, backed by an adversarial worst-case strategy engine. |
| **Chapter VII** | **The Three Oracles** | The Three Gods Riddle | Identify **Truth**, **False**, and **Random** speaking an unknown `DA`/`JA` tongue in **3 direct or embedded questions**; live 12-world logical solver. |

## Features

- **Pure, Tested Game Engines:** Each chapter's rules and optimal solvers live in framework-free `engine.ts` modules covered by **44 Vitest unit tests**.
- **Handcrafted Minimalist Visuals:** Custom SVG figures, weight-sensitive bridge physics, buoyant rowing water waves, animated liquid transfers, 3D swinging bronze vault doors, and veiled marble Oracles.
- **Dark & Light Themes:** Seamlessly switch between *Nocturne Ink* (dark) and *Warm Archival Parchment* (light), persisted in `localStorage`.
- **Zero-Asset Procedural Audio:** Synthesized Web Audio API footsteps, bridge creaks, oar strokes, pouring crystal liquids, vault locks, and oracle chimes with a global mute toggle.
- **3-Tier Progressive Hints:** Conceptual nudges, core strategy insights, and live solver-backed next-move guidance.

## Tech Stack

- **React 18** + **TypeScript** + **Vite 6**
- **Tailwind CSS 3** + **Framer Motion 11** + **Lucide React**
- **Vitest** for unit & solver verification

## Quick Start

```bash
# Install dependencies
npm install

# Launch local dev server (http://localhost:5173)
npm run dev

# Run all 33 game-engine unit tests
npm test

# Type-check and build production bundle
npm run build
```

## Project Structure

```text
├── .github/workflows/ci.yml   # Automated CI: tests + type-check + build
├── src/
│   ├── core/                  # Shared catalog, types, Web Audio synth & storage
│   ├── components/            # AnthologyHub gallery UI
│   └── games/
│       ├── bridge-riddle/     # Chapter I  — engine, tests, story & scene
│       ├── midnight-ferry/    # Chapter II — engine, tests, story & scene
│       ├── alchemist-jugs/    # Chapter III — engine, tests, story & scene
│       ├── three-doors/       # Chapter IV — engine, tests, story & scene
│       ├── penniless-pilgrim/ # Chapter V   — engine, tests, story & scene
│       ├── egg-drop/          # Chapter VI  — engine, tests, story & scene
│       └── three-oracles/     # Chapter VII — engine, tests, story & scene
├── CONTRIBUTING.md            # Guide for adding Chapter VI+
└── LICENSE                    # MIT License
```

## Deployment

This project builds to a static bundle in `dist/` (`npm run build`) and deploys cleanly to **Vercel**, **Netlify**, **Cloudflare Pages**, or **GitHub Pages** with zero backend requirements.

## License

Released under the [MIT License](./LICENSE).
