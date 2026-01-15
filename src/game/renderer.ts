import { drawGrid } from './render/grid';
import { drawParticles } from './render/particles';
import { drawEntities, drawChainLightning, drawTimeSlowEffects } from './render/entities';
import { drawFloatingTexts, drawUI } from './render/ui';
import { drawDebug } from './debug';
import { GameState } from './types';

export function renderScene(state: GameState & { debugEnabled?: boolean }) {
  const { ctx, canvas } = state;
  const lw = state.viewport?.width ?? canvas.width;
  const lh = state.viewport?.height ?? canvas.height;
  ctx.clearRect(0, 0, lw, lh);

  drawGrid(state);
  drawParticles(state);
  drawChainLightning(state); // Draw lightning UNDER entities for layering
  drawEntities(state);
  drawFloatingTexts(state);
  drawTimeSlowEffects(state); // Draw scanlines/ripple OVER entities but under UI
  drawUI(state);
  drawDebug({ ctx: state.ctx, fps: state.fps || 60, dtFactor: state.dtFactor, particles: state.particles, gameSpeed: state.gameSpeed, canvas: state.canvas, debugEnabled: state.debugEnabled });
}
