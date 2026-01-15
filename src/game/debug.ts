import { GameState } from './types';

export function drawDebug(state: GameState): void {
  const debugEnabled = state.debugEnabled;
  const debug = state.debug || { grid: true, boxes: false, particles: false };
  if (!debugEnabled) return;
  const { ctx, fps, dtFactor, particles, gameSpeed } = state;

  const w = 220;
  const h = 110;
  const x = 8;
  const y = 8;

  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(x, y, w, h);

  ctx.fillStyle = '#00ffff';
  ctx.font = '12px Orbitron';
  ctx.textAlign = 'left';
  ctx.fillText(`FPS: ${Math.round(fps)}`, x + 8, y + 20);
  ctx.fillText(`dtFactor: ${dtFactor.toFixed(2)}`, x + 8, y + 36);
  ctx.fillText(`Particles: ${particles.length}`, x + 8, y + 52);
  ctx.fillText(`Speed: ${gameSpeed.toFixed(2)}`, x + 8, y + 68);

  ctx.fillStyle = '#ff66ff';
  ctx.fillText('Debug toggles:', x + 8, y + 86);
  ctx.fillStyle = '#00ffff';
  ctx.fillText(`G - Grid: ${debug.grid ? 'ON' : 'OFF'}`, x + 12, y + 102);
  ctx.fillText(`B - Boxes: ${debug.boxes ? 'ON' : 'OFF'}`, x + 110, y + 102);
  ctx.fillText(`P - Particles: ${debug.particles ? 'ON' : 'OFF'}`, x + 12, y + 118);

  ctx.restore();
}
