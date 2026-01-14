import { MagnetStyle, PowerUpId, PowerUpPickup, TimeSlowStyle } from '../types';

const PICKUP_SIZE = 22;

export function spawnPowerUpPickup(state: any, id: PowerUpId, x: number, y: number, speed: number, style?: MagnetStyle, timeSlowStyle?: TimeSlowStyle) {
  const pickup: PowerUpPickup = { id, x, y, width: PICKUP_SIZE, height: PICKUP_SIZE, speed, style, timeSlowStyle };
  state.powerUpPickups.push(pickup);
}

export function updatePowerUpPickups(
  state: any,
  logicalWidth: number,
  logicalHeight: number,
  dtFactor: number,
  onCollect: (id: PowerUpId, pickup: PowerUpPickup) => void
) {
  const gameSpeed = state.modifiers?.gameSpeed ?? 1;
  
  for (let i = state.powerUpPickups.length - 1; i >= 0; i--) {
    const p = state.powerUpPickups[i];
    p.y += p.speed * dtFactor * gameSpeed;

    if (p.y > logicalHeight + PICKUP_SIZE) {
      state.powerUpPickups.splice(i, 1);
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
      state.powerUpPickups.splice(i, 1);
      onCollect(pickup.id, pickup);
    }
  }
}
