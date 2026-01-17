import { config } from '../config';
import { GameState, RainbowRainEvent } from '../types';
import { createCrystal, getRainbowCrystalType } from '../entities';

export function activateRainbowRain(state: GameState, now = performance.now()): void {
  state.activeRainbowRain = {
    startedAt: now,
    expiresAt: now + config.rainbowRain.DURATION_MS,
    lastSpawnAt: now
  };
}

export function tickRainbowRain(state: GameState, now = performance.now(), dtMs = 0): void {
  if (!state.activeRainbowRain) return;

  // Check if event has expired
  if (now >= state.activeRainbowRain.expiresAt) {
    state.activeRainbowRain = undefined;
    return;
  }

  // Check if it's time to spawn a new wave
  if (now - state.activeRainbowRain.lastSpawnAt >= config.rainbowRain.SPAWN_INTERVAL_MS) {
    spawnRainbowWave(state);
    state.activeRainbowRain.lastSpawnAt = now;
  }
}

function spawnRainbowWave(state: GameState): void {
  const canvasWidth = state.viewport?.width ?? state.canvas.width;
  const spreadWidth = canvasWidth * config.rainbowRain.HORIZONTAL_SPREAD;
  const startX = (canvasWidth - spreadWidth) / 2;
  
  const rainbowType = getRainbowCrystalType();
  if (!rainbowType) return;

  for (let i = 0; i < config.rainbowRain.CRYSTALS_PER_WAVE; i++) {
    const x = startX + Math.random() * spreadWidth;
    const y = -30; // Start above screen
    const speed = (2 + Math.random() * 2) * config.rainbowRain.CRYSTAL_SPEED_MULTIPLIER;
    
    const crystal = createCrystal(x, y, speed, rainbowType);
    state.crystals.push(crystal);
  }
}
