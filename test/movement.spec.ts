import { describe, test, expect } from 'vitest';
import {
  calculateMoveAmount,
  applyHorizontalMovement,
  applyVerticalMovement,
  getMovementBounds,
  updatePlayerPosition,
  getInitialPlayerY,
  clampPlayerPosition,
  MovementInput,
} from '../src/game/movement';

describe('calculateMoveAmount', () => {
  test('calculates movement based on speed and delta time', () => {
    const result = calculateMoveAmount(4, 1, 1);
    expect(result).toBe(4);
  });

  test('scales movement with delta time factor', () => {
    // dtFactor of 0.5 means half frame time (120fps)
    const result = calculateMoveAmount(4, 0.5, 1);
    expect(result).toBe(2);
  });

  test('applies speed modifier correctly', () => {
    // Speed modifier of 1.5 means 50% faster
    const result = calculateMoveAmount(4, 1, 1.5);
    expect(result).toBe(6);
  });

  test('handles zero values correctly', () => {
    expect(calculateMoveAmount(0, 1, 1)).toBe(0);
    expect(calculateMoveAmount(4, 0, 1)).toBe(0);
  });
});

describe('applyHorizontalMovement', () => {
  const playerWidth = 50;
  const canvasWidth = 400;

  test('moves left when input.left is true', () => {
    const result = applyHorizontalMovement(
      100,
      { left: true, right: false },
      5,
      playerWidth,
      canvasWidth
    );
    expect(result).toBe(95);
  });

  test('moves right when input.right is true', () => {
    const result = applyHorizontalMovement(
      100,
      { left: false, right: true },
      5,
      playerWidth,
      canvasWidth
    );
    expect(result).toBe(105);
  });

  test('does not move past left boundary', () => {
    const result = applyHorizontalMovement(
      3,
      { left: true, right: false },
      10,
      playerWidth,
      canvasWidth
    );
    expect(result).toBe(0);
  });

  test('does not move past right boundary', () => {
    const result = applyHorizontalMovement(
      348, // 400 - 50 - 2 = 348
      { left: false, right: true },
      10,
      playerWidth,
      canvasWidth
    );
    expect(result).toBe(350); // canvasWidth - playerWidth
  });

  test('cancels out when both directions are pressed', () => {
    // When both pressed: left moves first, then right moves
    // Net effect: -5 then +5 = 0 movement in total
    const result = applyHorizontalMovement(
      100,
      { left: true, right: true },
      5,
      playerWidth,
      canvasWidth
    );
    // Start 100 -> left makes 95 -> right makes 100
    expect(result).toBe(100);
  });

  test('does not move when no input', () => {
    const result = applyHorizontalMovement(
      100,
      { left: false, right: false },
      5,
      playerWidth,
      canvasWidth
    );
    expect(result).toBe(100);
  });
});

describe('applyVerticalMovement', () => {
  const playerHeight = 30;
  const canvasHeight = 500;
  const verticalPadding = 40;

  test('moves up when input.up is true', () => {
    const result = applyVerticalMovement(
      300,
      { up: true, down: false },
      5,
      playerHeight,
      canvasHeight,
      verticalPadding
    );
    expect(result).toBe(295);
  });

  test('moves down when input.down is true', () => {
    const result = applyVerticalMovement(
      300,
      { up: false, down: true },
      5,
      playerHeight,
      canvasHeight,
      verticalPadding
    );
    expect(result).toBe(305);
  });

  test('does not move past top boundary', () => {
    const result = applyVerticalMovement(
      45, // Close to top
      { up: true, down: false },
      10,
      playerHeight,
      canvasHeight,
      verticalPadding
    );
    expect(result).toBe(40); // verticalPadding
  });

  test('does not move past bottom boundary', () => {
    // Bottom bound = 500 - 40 - 30 = 430
    const result = applyVerticalMovement(
      428,
      { up: false, down: true },
      10,
      playerHeight,
      canvasHeight,
      verticalPadding
    );
    expect(result).toBe(430);
  });
});

describe('getMovementBounds', () => {
  test('returns correct bounds with vertical movement enabled', () => {
    const bounds = getMovementBounds(400, 500, 50, 30, 40, true);

    expect(bounds.minX).toBe(0);
    expect(bounds.maxX).toBe(350); // 400 - 50
    expect(bounds.minY).toBe(40); // padding
    expect(bounds.maxY).toBe(430); // 500 - 40 - 30
  });

  test('returns correct bounds with vertical movement disabled', () => {
    const bounds = getMovementBounds(400, 500, 50, 30, 40, false);

    expect(bounds.minX).toBe(0);
    expect(bounds.maxX).toBe(350);
    expect(bounds.minY).toBe(470); // 500 - 30 (locked at bottom)
    expect(bounds.maxY).toBe(470); // Same (no vertical movement)
  });
});

describe('updatePlayerPosition', () => {
  const player = { x: 200, y: 300, width: 50, height: 30, speed: 4 };
  const noInput: MovementInput = { left: false, right: false, up: false, down: false };

  test('updates position based on input', () => {
    const input: MovementInput = { left: true, right: false, up: false, down: false };
    const result = updatePlayerPosition(player, input, 1, 400, 500, 1, true);

    expect(result.x).toBe(196); // 200 - 4
    expect(result.y).toBe(300); // unchanged
  });

  test('handles vertical movement when enabled', () => {
    const input: MovementInput = { left: false, right: false, up: true, down: false };
    const result = updatePlayerPosition(player, input, 1, 400, 500, 1, true);

    expect(result.x).toBe(200);
    expect(result.y).toBe(296);
  });

  test('ignores vertical input when disabled', () => {
    const input: MovementInput = { left: false, right: false, up: true, down: false };
    const result = updatePlayerPosition(player, input, 1, 400, 500, 1, false);

    expect(result.y).toBe(300); // unchanged
  });

  test('applies speed modifier correctly', () => {
    const input: MovementInput = { left: true, right: false, up: false, down: false };
    const result = updatePlayerPosition(player, input, 1, 400, 500, 2, true);

    expect(result.x).toBe(192); // 200 - (4 * 2)
  });
});

describe('getInitialPlayerY', () => {
  test('returns correct Y with vertical movement enabled', () => {
    const y = getInitialPlayerY(500, 30, true, 40);
    expect(y).toBe(430); // 500 - 40 - 30
  });

  test('returns correct Y with vertical movement disabled', () => {
    const y = getInitialPlayerY(500, 30, false, 40);
    expect(y).toBe(440); // 500 - 60 (legacy positioning)
  });
});

describe('clampPlayerPosition', () => {
  test('clamps position to bounds', () => {
    const player = { x: -50, y: 600, width: 50, height: 30 };
    const result = clampPlayerPosition(player, 400, 500, true, 40);

    expect(result.x).toBe(0); // Clamped from -50
    expect(result.y).toBe(430); // Clamped from 600 to max (500-40-30)
  });

  test('does not modify position already in bounds', () => {
    const player = { x: 100, y: 200, width: 50, height: 30 };
    const result = clampPlayerPosition(player, 400, 500, true, 40);

    expect(result.x).toBe(100);
    expect(result.y).toBe(200);
  });
});
