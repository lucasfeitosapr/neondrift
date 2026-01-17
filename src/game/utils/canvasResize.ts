import { GameState } from '../types';
import { config } from '../config';
import { clampPlayerPosition } from '../movement';

export function resizeCanvas(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  state: GameState,
  logicalWidth: () => number,
  logicalHeight: () => number
): void {
  const padding = 32;
  const titleEl = document.querySelector('.title') as HTMLElement | null;
  const controlsEl = document.querySelector('.controls') as HTMLElement | null;
  const touchHintEl = document.querySelector('.touch-hint') as HTMLElement | null;
  const topHudEl = document.querySelector('.right-panel') as HTMLElement | null;
  const titleHeight = titleEl?.getBoundingClientRect().height ?? 0;
  const controlsHeight = controlsEl?.getBoundingClientRect().height ?? 0;
  const touchHintHeight = touchHintEl?.getBoundingClientRect().height ?? 0;
  const topHudHeight = topHudEl?.getBoundingClientRect().height ?? 0;
  const uiHeight = titleHeight + topHudHeight + Math.max(controlsHeight, touchHintHeight) + 24;

  // Mobile-friendly sizing: fit canvas to available space
  const availableWidth = window.innerWidth - padding;
  const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
  const availableHeight = viewportHeight - uiHeight - padding;

  // Maintain aspect ratio (360:640 ≈ 0.5625)
  const targetAspect = config.CANVAS_WIDTH / config.CANVAS_HEIGHT;
  const maxCanvasWidth = 520;
  let cssWidth = Math.min(maxCanvasWidth, availableWidth); // Cap width for comfortable play area
  let cssHeight = cssWidth / targetAspect;

  // If height is too tall, constrain by height instead
  if (cssHeight > availableHeight) {
    cssHeight = availableHeight;
    cssWidth = cssHeight * targetAspect;
  }

  // Minimum sizes for playability
  cssWidth = Math.max(280, cssWidth);
  cssHeight = Math.max(350, cssHeight);

  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;
  canvas.width = Math.max(1, Math.floor(cssWidth * dpr));
  canvas.height = Math.max(1, Math.floor(cssHeight * dpr));

  // Update viewport information
  state.viewport = { width: cssWidth, height: cssHeight, dpr };

  try {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  } catch {
    // DPR transform not supported
  }

  if (state.player) {
    // Center player horizontally and clamp to bounds using movement module
    state.player.x = Math.floor(logicalWidth() / 2 - state.player.width / 2);
    const clampedPos = clampPlayerPosition(
      state.player,
      logicalWidth(),
      logicalHeight(),
      config.ENABLE_VERTICAL_MOVEMENT
    );
    state.player.y = clampedPos.y;
  }
}
