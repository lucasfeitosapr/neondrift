# Power-Up System (TypeScript)

Goal: add/adjust power-ups by editing a single registry entry.

## Core pieces
- `definitions.ts`: registry (`powerUpRegistry`). Each entry: `id`, `displayName`, `kind` (`buff | instant`), optional `durationMs`, `stacking`, `maxStacks`, hooks (`applyModifiers`, `onActivate`, `onTick`, `onExpire`).
- `system.ts`: activation + per-frame ticking. Rebuilds `state.modifiers` each frame from active buffs.
- `pickups.ts`: spawn/update pickup entities; collision with player triggers `onCollect`.

## State extensions
- `state.modifiers`: derived each frame from active buffs (defaults in `defaultModifiers`).
- `state.activePowerUps`: active buff instances.
- `state.powerUpPickups`: falling pickups waiting to be collected.

## Adding a power-up
1) Add an entry to `powerUpRegistry` in `definitions.ts`.
2) Buffs: implement `applyModifiers` (prefer data-driven modifiers over branches elsewhere).
3) Instant effects: put the one-shot action in `onActivate`.
4) Spawn pickups via `spawnPowerUpPickup` or drop from an event (e.g., on crystal collect).

## Current sample power-ups
- `magnet` (buff): increases `modifiers.magnetRange` (stacking).
- `time_slow` (buff): slows global game speed and spawn rates.
- `chain_lightning` (instant): placeholder text; full effect to be implemented.
