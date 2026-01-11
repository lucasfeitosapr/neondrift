import { drawGrid } from './render/grid';
import { drawParticles } from './render/particles';
import { drawEntities } from './render/entities';
import { drawFloatingTexts, drawUI } from './render/ui';
import { drawDebug } from './debug';
import { GameState } from './types';

export function renderScene(state: GameState & { debugEnabled?: boolean }) {
  const { ctx, canvas } = state;
  const lw = (canvas as any)._cssWidth || canvas.width;
  const lh = (canvas as any)._cssHeight || canvas.height;
  ctx.clearRect(0, 0, lw, lh);

  drawGrid(state);
  drawParticles(state);
  drawEntities(state);
  drawFloatingTexts(state);
  drawUI(state);
  drawDebug({ ctx: state.ctx, fps: state.fps || 60, dtFactor: state.dtFactor, particles: state.particles, gameSpeed: state.gameSpeed, canvas: state.canvas, debugEnabled: state.debugEnabled });
}
