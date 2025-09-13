import { drawGrid } from './render/grid';
import { drawParticles } from './render/particles';
import { drawEntities } from './render/entities';
import { drawFloatingTexts, drawUI } from './render/ui';
import { drawDebug } from './debug';

export function renderScene(state: any) {
  const { ctx, canvas } = state;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawGrid(state);
  drawParticles(state);
  drawEntities(state);
  drawFloatingTexts(state);
  drawUI(state);
  drawDebug({ ctx: state.ctx, fps: state.fps || 60, dtFactor: state.dtFactor, particles: state.particles, gameSpeed: state.gameSpeed, canvas: state.canvas, debugEnabled: state.debugEnabled });
}
