import { config } from './config';

/**
 * Result of collecting a crystal
 */
export interface CollectionResult {
  pointsAwarded: number;
  newComboCount: number;
  comboMultiplier: number;
  comboMaintained: boolean;
}

/**
 * Calculate if a combo is maintained based on time since last collection
 */
export function isComboMaintained(
  now: number,
  lastCollectTimestamp: number,
  comboTimeout: number = config.COMBO_TIMEOUT
): boolean {
  return now - lastCollectTimestamp <= comboTimeout;
}

/**
 * Calculate the new combo count based on timing
 */
export function calculateNewComboCount(
  currentCombo: number,
  comboMaintained: boolean,
  maxCombo: number = config.MAX_COMBO
): number {
  if (comboMaintained) {
    return Math.min(maxCombo, currentCombo + 1);
  }
  return 1; // Reset to 1 on first collection after timeout
}

/**
 * Calculate the score multiplier based on combo count
 * Base multiplier is 1.0, with +0.5 for each combo level above 1
 */
export function calculateComboMultiplier(comboCount: number): number {
  return 1 + Math.max(0, comboCount - 1) * 0.5;
}

/**
 * Calculate points awarded for collecting a crystal
 */
export function calculatePointsAwarded(
  basePoints: number,
  comboMultiplier: number,
  scoreModifier: number = 1
): number {
  return Math.floor(basePoints * comboMultiplier * scoreModifier);
}

/**
 * Process a crystal collection and return all relevant scoring data
 */
export function processCrystalCollection(
  basePoints: number,
  now: number,
  lastCollectTimestamp: number,
  currentCombo: number,
  scoreModifier: number = 1,
  comboTimeout: number = config.COMBO_TIMEOUT,
  maxCombo: number = config.MAX_COMBO
): CollectionResult {
  const comboMaintained = isComboMaintained(now, lastCollectTimestamp, comboTimeout);
  const newComboCount = calculateNewComboCount(currentCombo, comboMaintained, maxCombo);
  const comboMultiplier = calculateComboMultiplier(newComboCount);
  const pointsAwarded = calculatePointsAwarded(basePoints, comboMultiplier, scoreModifier);

  return {
    pointsAwarded,
    newComboCount,
    comboMultiplier,
    comboMaintained,
  };
}

/**
 * Check if score milestone was reached for difficulty increase
 * Returns true if crossing a milestone boundary
 */
export function shouldIncreaseGameSpeed(
  previousScore: number,
  newScore: number,
  milestone: number = config.difficulty.SCORE_MILESTONE
): boolean {
  const previousMilestone = Math.floor(previousScore / milestone);
  const newMilestone = Math.floor(newScore / milestone);
  return newMilestone > previousMilestone;
}

/**
 * Calculate the new game speed, respecting the maximum cap
 */
export function calculateNewGameSpeed(
  currentSpeed: number,
  increment: number = config.difficulty.SPEED_INCREMENT,
  maxSpeed: number = config.difficulty.MAX_GAME_SPEED
): number {
  return Math.min(maxSpeed, currentSpeed + increment);
}

/**
 * Calculate the current difficulty level based on score
 */
export function getDifficultyLevel(
  score: number,
  milestone: number = config.difficulty.SCORE_MILESTONE
): number {
  return Math.floor(score / milestone) + 1;
}

/**
 * Calculate the maximum difficulty level based on speed increments
 */
export function getMaxDifficultyLevel(
  initialSpeed: number = config.INITIAL_GAME_SPEED,
  maxSpeed: number = config.difficulty.MAX_GAME_SPEED,
  increment: number = config.difficulty.SPEED_INCREMENT,
  milestone: number = config.difficulty.SCORE_MILESTONE
): number {
  const numIncrements = Math.floor((maxSpeed - initialSpeed) / increment);
  return numIncrements + 1;
}

/**
 * Calculate difficulty percentage (0-100%) based on game speed
 */
export function getDifficultyPercent(
  gameSpeed: number,
  initialSpeed: number = config.INITIAL_GAME_SPEED,
  maxSpeed: number = config.difficulty.MAX_GAME_SPEED
): number {
  const range = maxSpeed - initialSpeed;
  const current = gameSpeed - initialSpeed;
  return Math.min(100, Math.round((current / range) * 100));
}

/**
 * Check if score exceeds high score
 */
export function isNewHighScore(score: number, highScore: number): boolean {
  return score > highScore;
}

/**
 * Format score for display (6-digit padded)
 */
export function formatScore(score: number): string {
  return score.toString().padStart(6, '0');
}

/**
 * Get display label for score
 */
export function getScoreDisplayText(score: number): string {
  return `S C O R E : ${formatScore(score)}`;
}

/**
 * Get display label for high score
 */
export function getHighScoreDisplayText(highScore: number): string {
  return `H I G H : ${formatScore(highScore)}`;
}

/**
 * Get floating text for points gained
 */
export function getPointsText(points: number): string {
  return `+${points}`;
}

/**
 * Get floating text for combo multiplier
 */
export function getComboText(comboCount: number): string {
  return `x${comboCount}`;
}
