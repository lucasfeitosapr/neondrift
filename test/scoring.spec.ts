import { describe, test, expect } from 'vitest';
import {
  isComboMaintained,
  calculateNewComboCount,
  calculateComboMultiplier,
  calculatePointsAwarded,
  processCrystalCollection,
  shouldIncreaseGameSpeed,
  calculateNewGameSpeed,
  getDifficultyLevel,
  getDifficultyPercent,
  isNewHighScore,
  formatScore,
  getScoreDisplayText,
  getHighScoreDisplayText,
  getPointsText,
  getComboText,
} from '../src/game/scoring';

describe('isComboMaintained', () => {
  test('returns true when within combo timeout', () => {
    const now = 2000;
    const lastCollect = 1500; // 500ms ago
    expect(isComboMaintained(now, lastCollect, 1050)).toBe(true);
  });

  test('returns false when combo timeout exceeded', () => {
    const now = 3000;
    const lastCollect = 1000; // 2000ms ago
    expect(isComboMaintained(now, lastCollect, 1050)).toBe(false);
  });

  test('returns true at exact timeout boundary', () => {
    const now = 2050;
    const lastCollect = 1000; // exactly 1050ms ago
    expect(isComboMaintained(now, lastCollect, 1050)).toBe(true);
  });

  test('returns false just after timeout', () => {
    const now = 2051;
    const lastCollect = 1000; // 1051ms ago
    expect(isComboMaintained(now, lastCollect, 1050)).toBe(false);
  });
});

describe('calculateNewComboCount', () => {
  test('increments combo when maintained', () => {
    expect(calculateNewComboCount(3, true, 6)).toBe(4);
  });

  test('resets to 1 when not maintained', () => {
    expect(calculateNewComboCount(5, false, 6)).toBe(1);
  });

  test('caps at max combo', () => {
    expect(calculateNewComboCount(6, true, 6)).toBe(6);
    expect(calculateNewComboCount(10, true, 6)).toBe(6);
  });

  test('starts at 1 for first collection', () => {
    expect(calculateNewComboCount(0, false, 6)).toBe(1);
  });
});

describe('calculateComboMultiplier', () => {
  test('returns 1.0 for combo count 1', () => {
    expect(calculateComboMultiplier(1)).toBe(1);
  });

  test('returns 1.5 for combo count 2', () => {
    expect(calculateComboMultiplier(2)).toBe(1.5);
  });

  test('returns 2.0 for combo count 3', () => {
    expect(calculateComboMultiplier(3)).toBe(2.0);
  });

  test('returns 3.5 for max combo 6', () => {
    // 1 + (6-1) * 0.5 = 1 + 2.5 = 3.5
    expect(calculateComboMultiplier(6)).toBe(3.5);
  });

  test('handles combo count 0 gracefully', () => {
    // Edge case: should return 1
    expect(calculateComboMultiplier(0)).toBe(1);
  });
});

describe('calculatePointsAwarded', () => {
  test('calculates base points with no multipliers', () => {
    expect(calculatePointsAwarded(100, 1, 1)).toBe(100);
  });

  test('applies combo multiplier', () => {
    expect(calculatePointsAwarded(100, 1.5, 1)).toBe(150);
  });

  test('applies score modifier', () => {
    expect(calculatePointsAwarded(100, 1, 2)).toBe(200);
  });

  test('combines multipliers and floors result', () => {
    // 100 * 1.5 * 1.2 = 180
    expect(calculatePointsAwarded(100, 1.5, 1.2)).toBe(180);
  });

  test('floors fractional points', () => {
    // 10 * 1.5 * 1.1 = 16.5 -> 16
    expect(calculatePointsAwarded(10, 1.5, 1.1)).toBe(16);
  });
});

describe('processCrystalCollection', () => {
  test('processes first collection correctly', () => {
    const result = processCrystalCollection(
      100, // base points
      10000, // now
      0, // last collect at 0 (10000ms ago - well past timeout)
      0, // current combo
      1 // score modifier
    );

    expect(result.newComboCount).toBe(1);
    expect(result.comboMultiplier).toBe(1);
    expect(result.pointsAwarded).toBe(100);
    expect(result.comboMaintained).toBe(false);
  });

  test('processes combo collection correctly', () => {
    const result = processCrystalCollection(
      100,
      2000, // now
      1500, // last collect 500ms ago
      2, // current combo
      1
    );

    expect(result.comboMaintained).toBe(true);
    expect(result.newComboCount).toBe(3);
    expect(result.comboMultiplier).toBe(2.0);
    expect(result.pointsAwarded).toBe(200);
  });

  test('resets combo after timeout', () => {
    const result = processCrystalCollection(
      100,
      5000, // now
      2000, // last collect 3000ms ago (timeout!)
      5, // current combo
      1
    );

    expect(result.comboMaintained).toBe(false);
    expect(result.newComboCount).toBe(1);
    expect(result.comboMultiplier).toBe(1);
    expect(result.pointsAwarded).toBe(100);
  });

  test('applies score modifier correctly', () => {
    const result = processCrystalCollection(
      100,
      2000,
      1500,
      1,
      2 // 2x score modifier
    );

    // Combo maintained: 1 + 1 = 2
    // Multiplier: 1 + (2-1)*0.5 = 1.5
    // Points: 100 * 1.5 * 2 = 300
    expect(result.pointsAwarded).toBe(300);
  });
});

describe('shouldIncreaseGameSpeed', () => {
  test('returns true when crossing milestone boundary', () => {
    // Using explicit milestone of 100 for test consistency
    expect(shouldIncreaseGameSpeed(95, 105, 100)).toBe(true);
  });

  test('returns false when staying within same milestone', () => {
    expect(shouldIncreaseGameSpeed(50, 80, 100)).toBe(false);
  });

  test('returns true when crossing multiple boundaries', () => {
    expect(shouldIncreaseGameSpeed(50, 250, 100)).toBe(true);
  });

  test('handles exact boundary correctly', () => {
    expect(shouldIncreaseGameSpeed(99, 100, 100)).toBe(true);
  });

  test('returns false at same score', () => {
    expect(shouldIncreaseGameSpeed(100, 100, 100)).toBe(false);
  });

  test('works with default milestone (500)', () => {
    expect(shouldIncreaseGameSpeed(450, 550)).toBe(true);
    expect(shouldIncreaseGameSpeed(100, 400)).toBe(false);
  });
});

describe('calculateNewGameSpeed', () => {
  test('increases speed by increment', () => {
    expect(calculateNewGameSpeed(2, 0.25, 6)).toBe(2.25);
  });

  test('respects maximum speed cap', () => {
    expect(calculateNewGameSpeed(5.9, 0.25, 6)).toBe(6);
  });

  test('does not exceed max when already at max', () => {
    expect(calculateNewGameSpeed(6, 0.25, 6)).toBe(6);
  });
});

describe('getDifficultyLevel', () => {
  test('returns level 1 at start', () => {
    expect(getDifficultyLevel(0, 500)).toBe(1);
    expect(getDifficultyLevel(499, 500)).toBe(1);
  });

  test('increments level at milestone', () => {
    expect(getDifficultyLevel(500, 500)).toBe(2);
    expect(getDifficultyLevel(1000, 500)).toBe(3);
  });
});

describe('getDifficultyPercent', () => {
  test('returns 0% at initial speed', () => {
    expect(getDifficultyPercent(2, 2, 6)).toBe(0);
  });

  test('returns 50% at midpoint', () => {
    expect(getDifficultyPercent(4, 2, 6)).toBe(50);
  });

  test('returns 100% at max speed', () => {
    expect(getDifficultyPercent(6, 2, 6)).toBe(100);
  });

  test('caps at 100% if somehow over max', () => {
    expect(getDifficultyPercent(10, 2, 6)).toBe(100);
  });
});

describe('isNewHighScore', () => {
  test('returns true when score exceeds high score', () => {
    expect(isNewHighScore(1000, 500)).toBe(true);
  });

  test('returns false when score equals high score', () => {
    expect(isNewHighScore(500, 500)).toBe(false);
  });

  test('returns false when score is below high score', () => {
    expect(isNewHighScore(200, 500)).toBe(false);
  });
});

describe('formatScore', () => {
  test('pads single digit scores', () => {
    expect(formatScore(5)).toBe('000005');
  });

  test('pads multi-digit scores', () => {
    expect(formatScore(123)).toBe('000123');
  });

  test('handles 6-digit scores without padding', () => {
    expect(formatScore(123456)).toBe('123456');
  });

  test('handles 0 correctly', () => {
    expect(formatScore(0)).toBe('000000');
  });
});

describe('display text functions', () => {
  test('getScoreDisplayText formats correctly', () => {
    expect(getScoreDisplayText(1234)).toBe('S C O R E : 001234');
  });

  test('getHighScoreDisplayText formats correctly', () => {
    expect(getHighScoreDisplayText(9999)).toBe('H I G H : 009999');
  });

  test('getPointsText shows plus sign', () => {
    expect(getPointsText(150)).toBe('+150');
  });

  test('getComboText shows multiplier', () => {
    expect(getComboText(3)).toBe('x3');
  });
});
