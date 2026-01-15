import { config } from './config';
import { Player } from './types';

/**
 * Input state for movement calculations
 */
export interface MovementInput {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
}

/**
 * Bounds for constraining player movement
 */
export interface MovementBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * Calculate the effective move amount based on speed, delta time, and modifiers
 */
export function calculateMoveAmount(
  baseSpeed: number,
  dtFactor: number,
  speedModifier: number = 1
): number {
  return baseSpeed * dtFactor * speedModifier;
}

/**
 * Apply horizontal movement based on input
 * Returns the new X position clamped to bounds
 */
export function applyHorizontalMovement(
  currentX: number,
  input: Pick<MovementInput, 'left' | 'right'>,
  moveAmount: number,
  playerWidth: number,
  canvasWidth: number
): number {
  let newX = currentX;
  const maxX = canvasWidth - playerWidth;

  if (input.left && newX > 0) {
    newX = Math.max(0, newX - moveAmount);
  }
  if (input.right && newX < maxX) {
    newX = Math.min(maxX, newX + moveAmount);
  }

  return newX;
}

/**
 * Apply vertical movement based on input (when enabled)
 * Returns the new Y position clamped to bounds
 */
export function applyVerticalMovement(
  currentY: number,
  input: Pick<MovementInput, 'up' | 'down'>,
  moveAmount: number,
  playerHeight: number,
  canvasHeight: number,
  verticalPadding: number = config.PLAYER_VERTICAL_PADDING
): number {
  const topBound = verticalPadding;
  const bottomBound = canvasHeight - verticalPadding - playerHeight;
  let newY = currentY;

  if (input.up && currentY > topBound) {
    newY = Math.max(topBound, currentY - moveAmount);
  }
  if (input.down && currentY < bottomBound) {
    newY = Math.min(bottomBound, currentY + moveAmount);
  }

  return newY;
}

/**
 * Calculate movement bounds for the player
 */
export function getMovementBounds(
  canvasWidth: number,
  canvasHeight: number,
  playerWidth: number,
  playerHeight: number,
  verticalPadding: number = config.PLAYER_VERTICAL_PADDING,
  enableVerticalMovement: boolean = config.ENABLE_VERTICAL_MOVEMENT
): MovementBounds {
  return {
    minX: 0,
    maxX: canvasWidth - playerWidth,
    minY: enableVerticalMovement ? verticalPadding : canvasHeight - playerHeight,
    maxY: enableVerticalMovement
      ? canvasHeight - verticalPadding - playerHeight
      : canvasHeight - playerHeight,
  };
}

/**
 * Update player position based on input
 * Pure function that returns new position without mutating player
 */
export function updatePlayerPosition(
  player: Pick<Player, 'x' | 'y' | 'width' | 'height' | 'speed'>,
  input: MovementInput,
  dtFactor: number,
  canvasWidth: number,
  canvasHeight: number,
  speedModifier: number = 1,
  enableVerticalMovement: boolean = config.ENABLE_VERTICAL_MOVEMENT
): { x: number; y: number } {
  const moveAmount = calculateMoveAmount(player.speed, dtFactor, speedModifier);

  const newX = applyHorizontalMovement(
    player.x,
    input,
    moveAmount,
    player.width,
    canvasWidth
  );

  let newY = player.y;
  if (enableVerticalMovement) {
    newY = applyVerticalMovement(
      player.y,
      input,
      moveAmount,
      player.height,
      canvasHeight
    );
  }

  return { x: newX, y: newY };
}

/**
 * Get the initial player Y position based on canvas height and settings
 */
export function getInitialPlayerY(
  canvasHeight: number,
  playerHeight: number,
  enableVerticalMovement: boolean = config.ENABLE_VERTICAL_MOVEMENT,
  verticalPadding: number = config.PLAYER_VERTICAL_PADDING
): number {
  return enableVerticalMovement
    ? canvasHeight - verticalPadding - playerHeight
    : canvasHeight - 60;
}

/**
 * Clamp player position to valid bounds after canvas resize
 */
export function clampPlayerPosition(
  player: Pick<Player, 'x' | 'y' | 'width' | 'height'>,
  canvasWidth: number,
  canvasHeight: number,
  enableVerticalMovement: boolean = config.ENABLE_VERTICAL_MOVEMENT,
  verticalPadding: number = config.PLAYER_VERTICAL_PADDING
): { x: number; y: number } {
  const bounds = getMovementBounds(
    canvasWidth,
    canvasHeight,
    player.width,
    player.height,
    verticalPadding,
    enableVerticalMovement
  );

  return {
    x: Math.max(bounds.minX, Math.min(bounds.maxX, player.x)),
    y: Math.max(bounds.minY, Math.min(bounds.maxY, player.y)),
  };
}
