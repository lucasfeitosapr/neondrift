import { config } from './config';
import { createCrystalEntity, createMeteorEntity } from './entities';
import { GameState, Meteor } from './types';

export function spawnCrystal(state: Pick<GameState, 'canvas' | 'gameSpeed' | 'score' | 'crystals'>) {
  const c = createCrystalEntity(state.canvas, state.gameSpeed, state.score);
  state.crystals.push(c);
}

export function spawnMeteor(state: Pick<GameState, 'canvas' | 'gameSpeed' | 'meteors'>) {
  const m = createMeteorEntity(state.canvas, state.gameSpeed);
  state.meteors.push(m);
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
