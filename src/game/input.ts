import { GameState } from './types';

export const keys: Record<string, boolean> = {};

export function initInput(state?: GameState): void {
  // normalize to lowercase keys
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    keys[k] = true;
    // optionally restart game on any key when game is not running
    if (state && !state.gameRunning) {
      // caller is responsible for wiring restart; we set a flag on state to signal a restart request
      (state as any)._restartRequested = true;
    }
  });

  document.addEventListener('keyup', (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    keys[k] = false;
  });
}
