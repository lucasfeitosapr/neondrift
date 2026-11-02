# Neon Drift

A neon arcade game for the browser. You drift left and right, collect crystals, dodge meteors and chain combos while the difficulty ramps up. Runs are short, fast and replayable.

Built solo in TypeScript with Vite and the HTML Canvas API. It started as a single HTML file (`neon_drift.html`, kept in the repo) and grew into a modular codebase with tests.

## Who it's for

- **Players** who like quick score-chasing arcade runs in the browser.
- **Developers** curious about how a small canvas game can be structured: game loop, spawner, object pooling, power-up system, event system.

## Features

- Crystal collection with combo scoring and combo-driven difficulty
- Meteors as hazards, including a "revenge" meteor
- Power-ups: **Magnet**, **Time Slow**, **Chain Lightning**
- **Rainbow Rain** event
- Main menu, pause and restart
- High score saved in the browser
- Debug overlay (FPS, collision boxes, grid, particles)

Work in progress on the `feat/experimental` branch: seeded runs, daily challenges and an "Oracle" mechanic.

## Tech stack

- TypeScript (strict), HTML Canvas
- Vite (dev server and build)
- Vitest + jsdom (tests)
- ESLint
- Optional: Docker + nginx image for static hosting

## Running it

Requirements: Node.js 20+.

```bash
npm ci
npm run dev      # dev server
npm run build    # production build into dist/
npm run preview  # serve the build locally
npm test         # tests (watch mode); add -- --run for a single run
```

Docker:

```bash
docker build -t neondrift .
docker run -p 8080:8080 neondrift
```

## Controls

- **Move:** Left / Right arrows, or A / D
- **Restart:** any key on the game over screen
- **Debug:** backquote (`) toggles the overlay, G the grid, B collision boxes, P particles

## Project layout

- `src/main.ts`: bootstrap and DOM bindings
- `src/game/game.ts`: main loop and high-level state
- `src/game/renderer.ts`, `src/game/render/`: rendering
- `src/game/spawner.ts`: crystal and meteor spawning
- `src/game/powerups/`: power-up definitions, pickups and system
- `src/game/events/`: timed events (Rainbow Rain)
- `src/game/config.ts`: tuning constants
- `test/`: Vitest specs

## Roadmap

See [ROADMAP.md](ROADMAP.md). The next milestone is a first public release on itch.io.

## License

[MIT](LICENSE)
