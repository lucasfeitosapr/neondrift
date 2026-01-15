import { config } from './config';
import { createCatEntity, createCrystalEntity, createMeteorEntity } from './entities';
import { CatDrop, GameState, Meteor } from './types';

export function spawnCrystal(state: Pick<GameState, 'canvas' | 'viewport' | 'gameSpeed' | 'score' | 'crystals'>): void {
  const logicalWidth = state.viewport?.width ?? state.canvas.width;
  const c = createCrystalEntity(logicalWidth, state.gameSpeed, state.score);
  state.crystals.push(c);
}

export function spawnMeteor(state: Pick<GameState, 'canvas' | 'viewport' | 'gameSpeed' | 'meteors'>): void {
  const logicalWidth = state.viewport?.width ?? state.canvas.width;
  const m = createMeteorEntity(logicalWidth, state.gameSpeed);
  state.meteors.push(m);
}

export function spawnCat(state: Pick<GameState, 'canvas' | 'viewport' | 'gameSpeed' | 'cats'>): CatDrop {
  const logicalWidth = state.viewport?.width ?? state.canvas.width;
  const c = createCatEntity(logicalWidth, state.gameSpeed);
  state.cats.push(c);
  return c;
}

// ═══════════════════════════════════════════════════════════════
// REVENGE METEOR - Spawns directly above target position
// ═══════════════════════════════════════════════════════════════
export function spawnRevengeMeteor(
  state: Pick<GameState, 'canvas' | 'meteors'>,
  targetX: number,
  _targetY: number, // Reserved for future diagonal targeting
  speed: number
): Meteor {
  const meteor: Meteor = {
    x: targetX - config.meteor.size / 2, // Center on target X
    y: -config.meteor.size,               // Spawn above screen
    width: config.meteor.size,
    height: config.meteor.size,
    speed: speed,
    rotation: 0,
    pulse: 0
  };
  
  state.meteors.push(meteor);
  return meteor;
}
