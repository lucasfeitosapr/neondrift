import { config } from './config';

/**
 * Represents a rectangular bounding box for collision detection
 */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Standard axis-aligned bounding box (AABB) collision detection
 * Returns true if the two boxes overlap
 */
export function checkCollision(obj1: BoundingBox, obj2: BoundingBox): boolean {
  return (
    obj1.x < obj2.x + obj2.width &&
    obj1.x + obj1.width > obj2.x &&
    obj1.y < obj2.y + obj2.height &&
    obj1.y + obj1.height > obj2.y
  );
}

/**
 * Player-specific collision detection with shrunk hitbox
 * The player's visual triangle shape has empty corners, so we shrink
 * the collision box to match the actual ship shape more closely
 */
export function checkPlayerCollision(
  player: BoundingBox,
  obj: BoundingBox,
  topInset: number = config.PLAYER_HITBOX_TOP_INSET,
  sideInset: number = config.PLAYER_HITBOX_SIDE_INSET
): boolean {
  // Shrunk player hitbox
  const px = player.x + sideInset;
  const py = player.y + topInset;
  const pw = player.width - sideInset * 2;
  const ph = player.height - topInset;

  return (
    px < obj.x + obj.width &&
    px + pw > obj.x &&
    py < obj.y + obj.height &&
    py + ph > obj.y
  );
}

/**
 * Calculate the center point of a bounding box
 */
export function getCenter(box: BoundingBox): { x: number; y: number } {
  return {
    x: box.x + box.width / 2,
    y: box.y + box.height / 2
  };
}

/**
 * Calculate the distance between two bounding box centers
 */
export function getDistance(box1: BoundingBox, box2: BoundingBox): number {
  const c1 = getCenter(box1);
  const c2 = getCenter(box2);
  return Math.hypot(c2.x - c1.x, c2.y - c1.y);
}

/**
 * Check if a point is within range of a bounding box center
 */
export function isInRange(
  point: { x: number; y: number },
  box: BoundingBox,
  range: number
): boolean {
  const center = getCenter(box);
  const dist = Math.hypot(point.x - center.x, point.y - center.y);
  return dist < range;
}
