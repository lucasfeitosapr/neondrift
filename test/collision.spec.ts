import { describe, test, expect } from 'vitest';
import {
  checkCollision,
  checkPlayerCollision,
  getCenter,
  getDistance,
  isInRange,
  BoundingBox,
} from '../src/game/collision';

describe('checkCollision', () => {
  test('returns true when boxes overlap', () => {
    const box1: BoundingBox = { x: 0, y: 0, width: 50, height: 50 };
    const box2: BoundingBox = { x: 25, y: 25, width: 50, height: 50 };

    expect(checkCollision(box1, box2)).toBe(true);
  });

  test('returns true when boxes are fully overlapping', () => {
    const box1: BoundingBox = { x: 10, y: 10, width: 100, height: 100 };
    const box2: BoundingBox = { x: 30, y: 30, width: 40, height: 40 };

    expect(checkCollision(box1, box2)).toBe(true);
    expect(checkCollision(box2, box1)).toBe(true);
  });

  test('returns false when boxes do not overlap horizontally', () => {
    const box1: BoundingBox = { x: 0, y: 0, width: 50, height: 50 };
    const box2: BoundingBox = { x: 100, y: 0, width: 50, height: 50 };

    expect(checkCollision(box1, box2)).toBe(false);
  });

  test('returns false when boxes do not overlap vertically', () => {
    const box1: BoundingBox = { x: 0, y: 0, width: 50, height: 50 };
    const box2: BoundingBox = { x: 0, y: 100, width: 50, height: 50 };

    expect(checkCollision(box1, box2)).toBe(false);
  });

  test('returns false when boxes are adjacent (touching edges)', () => {
    const box1: BoundingBox = { x: 0, y: 0, width: 50, height: 50 };
    const box2: BoundingBox = { x: 50, y: 0, width: 50, height: 50 };

    // Boxes are exactly touching but not overlapping
    expect(checkCollision(box1, box2)).toBe(false);
  });

  test('handles zero-size boxes correctly', () => {
    const box1: BoundingBox = { x: 10, y: 10, width: 0, height: 0 };
    const box2: BoundingBox = { x: 10, y: 10, width: 50, height: 50 };

    // Zero-size box at corner of another box should not collide
    expect(checkCollision(box1, box2)).toBe(false);
  });
});

describe('checkPlayerCollision', () => {
  test('returns true when player shrunk hitbox overlaps object', () => {
    const player: BoundingBox = { x: 50, y: 50, width: 50, height: 30 };
    const meteor: BoundingBox = { x: 60, y: 65, width: 30, height: 30 };

    // Using default insets (top: 10, side: 5)
    expect(checkPlayerCollision(player, meteor)).toBe(true);
  });

  test('returns false when collision would only hit empty player corners', () => {
    const player: BoundingBox = { x: 50, y: 50, width: 50, height: 30 };
    // Place meteor in the top-left "empty corner" area
    const meteor: BoundingBox = { x: 48, y: 48, width: 10, height: 10 };

    // With insets, the player hitbox doesn't extend to corners
    // Default: topInset=10, sideInset=5
    // Player shrunk box: x=55, y=60, width=40, height=20
    expect(checkPlayerCollision(player, meteor)).toBe(false);
  });

  test('respects custom inset values', () => {
    const player: BoundingBox = { x: 50, y: 50, width: 50, height: 30 };
    const object: BoundingBox = { x: 52, y: 52, width: 10, height: 10 };

    // With no insets, this would collide
    expect(checkPlayerCollision(player, object, 0, 0)).toBe(true);

    // With large insets, player hitbox is much smaller and misses
    expect(checkPlayerCollision(player, object, 15, 15)).toBe(false);
  });

  test('handles player at screen edge correctly', () => {
    const player: BoundingBox = { x: 0, y: 400, width: 50, height: 30 };
    const meteor: BoundingBox = { x: 10, y: 410, width: 30, height: 30 };

    expect(checkPlayerCollision(player, meteor)).toBe(true);
  });
});

describe('getCenter', () => {
  test('calculates center of box correctly', () => {
    const box: BoundingBox = { x: 0, y: 0, width: 100, height: 100 };
    const center = getCenter(box);

    expect(center.x).toBe(50);
    expect(center.y).toBe(50);
  });

  test('handles offset boxes', () => {
    const box: BoundingBox = { x: 50, y: 30, width: 40, height: 20 };
    const center = getCenter(box);

    expect(center.x).toBe(70);
    expect(center.y).toBe(40);
  });
});

describe('getDistance', () => {
  test('calculates distance between box centers', () => {
    const box1: BoundingBox = { x: 0, y: 0, width: 10, height: 10 };
    const box2: BoundingBox = { x: 30, y: 40, width: 10, height: 10 };

    // Centers: (5, 5) and (35, 45)
    // Distance: sqrt((35-5)^2 + (45-5)^2) = sqrt(900 + 1600) = sqrt(2500) = 50
    expect(getDistance(box1, box2)).toBe(50);
  });

  test('returns 0 for same position boxes', () => {
    const box1: BoundingBox = { x: 10, y: 10, width: 20, height: 20 };
    const box2: BoundingBox = { x: 10, y: 10, width: 20, height: 20 };

    expect(getDistance(box1, box2)).toBe(0);
  });
});

describe('isInRange', () => {
  test('returns true when point is within range of box center', () => {
    const point = { x: 50, y: 50 };
    const box: BoundingBox = { x: 40, y: 40, width: 20, height: 20 };

    // Box center is (50, 50), distance is 0
    expect(isInRange(point, box, 10)).toBe(true);
  });

  test('returns false when point is outside range', () => {
    const point = { x: 0, y: 0 };
    const box: BoundingBox = { x: 90, y: 90, width: 20, height: 20 };

    // Box center is (100, 100), distance is ~141.4
    expect(isInRange(point, box, 100)).toBe(false);
  });

  test('returns false when point is exactly at range boundary', () => {
    const point = { x: 0, y: 0 };
    const box: BoundingBox = { x: 90, y: 0, width: 20, height: 20 };

    // Box center is (100, 10), distance is ~100.5
    // Using range of exactly the distance should return false (< not <=)
    const dist = Math.hypot(100 - 0, 10 - 0);
    expect(isInRange(point, box, dist)).toBe(false);
  });
});
