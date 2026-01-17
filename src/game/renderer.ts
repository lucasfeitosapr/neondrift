import { drawGrid } from './render/grid';
import { drawParticles } from './render/particles';
import { drawEntities, drawChainLightning, drawTimeSlowEffects, drawRainbowRainEffect } from './render/entities';
import { drawFloatingTexts, drawUI } from './render/ui';
import { drawDebug } from './debug';
import { GameState } from './types';

export function renderScene(state: GameState & { debugEnabled?: boolean }): void {
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
  drawRainbowRainEffect(state); // Draw rainbow overlay effect
  drawUI(state);
  drawDebug(state);
}
