import { GameState, MagnetStyle, PowerUpId, PowerUpPickup, TimeSlowStyle } from '../types';
import { removeAtSwap } from '../utils/arrayUtils';

const PICKUP_SIZE = 22;

export function spawnPowerUpPickup(state: GameState, id: PowerUpId, x: number, y: number, speed: number, style?: MagnetStyle, timeSlowStyle?: TimeSlowStyle): void {
  const pickup: PowerUpPickup = { id, x, y, width: PICKUP_SIZE, height: PICKUP_SIZE, speed, style, timeSlowStyle };
  state.powerUpPickups.push(pickup);
}

export function updatePowerUpPickups(
  state: GameState,
  logicalWidth: number,
  logicalHeight: number,
  dtFactor: number,
  onCollect: (id: PowerUpId, pickup: PowerUpPickup) => void
): void {
  const gameSpeed = state.modifiers?.gameSpeed ?? 1;
  
  for (let i = state.powerUpPickups.length - 1; i >= 0; i--) {
    const p = state.powerUpPickups[i];
    p.y += p.speed * dtFactor * gameSpeed;

    if (p.y > logicalHeight + PICKUP_SIZE) {
      removeAtSwap(state.powerUpPickups, i);
      continue;
    }

    if (!state.player) continue;
    const collides =
      p.x < state.player.x + state.player.width &&
      p.x + p.width > state.player.x &&
      p.y < state.player.y + state.player.height &&
      p.y + p.height > state.player.y;
    if (collides) {
      const pickup = state.powerUpPickups[i];
      removeAtSwap(state.powerUpPickups, i);
      onCollect(pickup.id, pickup);
    }
  }
}
