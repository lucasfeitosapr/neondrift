import { GameState, RunSeedPayload } from './types';
import { config } from './config';
import { defaultModifiers } from './state';
import { seedRng } from './rng';
import { getInitialPlayerY } from './movement';
import { getScoreDisplayText } from './scoring';

export function restartGame(
  state: GameState,
  logicalWidth: () => number,
  logicalHeight: () => number,
  scoreElement: HTMLElement,
  seed: RunSeedPayload
): void {
  seedRng(seed.seed);
  state.runSeed = seed;
  state._awaitingQuantumSeed = false;

  state.score = 0;
  state.gameSpeed = config.INITIAL_GAME_SPEED;
  state.gameRunning = true;
  state.paused = false;
  state.resumeCountdownActive = false;
  state.resumeCountdownTarget = null;
  state.resumeCountdownValue = undefined;

  state.crystals.length = 0;
  state.meteors.length = 0;
  state.cats.length = 0;
  state.particles.length = 0;

  if (state.player) {
    state.player.x = logicalWidth() / 2 - 25;
    state.player.y = getInitialPlayerY(logicalHeight(), state.player.height, config.ENABLE_VERTICAL_MOVEMENT);
    state.player.trail = [];
  }

  state.floatingTexts.length = 0;
  state.comboCount = 0;
  state.lastCollectTimestamp = 0;
  state.activePowerUps.length = 0;
  state.powerUpPickups.length = 0;
  state.chainLightningArcs.length = 0;
  state.timeSlowRipples.length = 0;
  state.pendingRevengeMeteors.length = 0;
  state.modifiers = { ...defaultModifiers };
  state.lastCatSpawnTimestamp = 0;
  state.runElapsedMs = 0;

  scoreElement.textContent = getScoreDisplayText(state.score);
}
