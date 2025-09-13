# Neon Drift

A small TypeScript + Vite arcade prototype inspired by neon aesthetic and fast pickup gameplay. The game is implemented as a modular TypeScript project under `src/game/` and bootstrapped from `src/main.ts`.

Status
- Playable prototype: player movement, collectible crystals, hazards (meteors), particle effects, combo scoring, and high-score persistence are implemented.
- Systems: renderer, spawner, input, particle pool, simple debug overlay.

Quick start
1. cd to project root
2. npm install
3. npm run dev

Build
- npm run build
- npm run preview

Controls
- Move: Left / Right arrows or A / D
- Restart: press any key when game over
- Debug toggles: ` (backquote) to toggle overlay, G to toggle grid, B to toggle collision boxes, P to toggle particles

Where to look in the code
- `src/main.ts` — app bootstrap and DOM bindings
- `src/game/game.ts` — main game loop and high-level game state
- `src/game/renderer.ts` — rendering logic extracted from the original single-file game
- `src/game/spawner.ts` — crystal and meteor spawn logic
- `src/game/input.ts` — input handling module
- `src/game/pool.ts` — particle pooling utility
- `src/game/config.ts` — tuning constants

Notes for contributors
- TypeScript + Vite setup; keep changes modular and add tests where possible.
- Prefer small PRs focused on a single feature or polish task.

If you want, I can also add CONTRIBUTING.md, LICENSE, or a short changelog file.
