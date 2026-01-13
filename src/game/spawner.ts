import { createCrystalEntity, createMeteorEntity } from './entities';
import { GameState } from './types';

export function spawnCrystal(state: Pick<GameState, 'canvas' | 'gameSpeed' | 'score' | 'crystals'>) {
  const c = createCrystalEntity(state.canvas, state.gameSpeed, state.score);
  state.crystals.push(c);
}

export function spawnMeteor(state: Pick<GameState, 'canvas' | 'gameSpeed' | 'meteors'>) {
  const m = createMeteorEntity(state.canvas, state.gameSpeed);
  state.meteors.push(m);
}
