import { describe, test, expect } from 'vitest';
import { createCrystalEntity, createMeteorEntity, createCatEntity } from '../src/game/entities';
import { config } from '../src/game/config';

describe('createCrystalEntity', () => {
  test('creates crystal with valid parameters', () => {
    const crystal = createCrystalEntity(360, 2, 0);
    
    expect(crystal).toBeDefined();
    expect(crystal.width).toBe(config.crystal.size);
    expect(crystal.height).toBe(config.crystal.size);
    expect(crystal.y).toBe(-config.crystal.size);
    expect(crystal.type.color).toBe('cyan'); // At score 0, only cyan available
  });

  test('handles crystal creation with zero logicalWidth', () => {
    const crystal = createCrystalEntity(0, 2, 0);
    
    expect(crystal).toBeDefined();
    // When logicalWidth is 0, Math.random() * (0 - size) can be negative
    // The code doesn't clamp, so we just verify it doesn't crash
    expect(typeof crystal.x).toBe('number');
  });

  test('handles crystal creation with negative logicalWidth', () => {
    const crystal = createCrystalEntity(-100, 2, 0);
    
    expect(crystal).toBeDefined();
    // x calculation: Math.random() * (negative - size) = negative
    expect(crystal.x).toBeLessThanOrEqual(0);
  });

  test('handles crystal creation at screen boundaries', () => {
    const logicalWidth = config.crystal.size;
    const crystal = createCrystalEntity(logicalWidth, 2, 0);
    
    expect(crystal.x).toBeGreaterThanOrEqual(0);
    expect(crystal.x).toBeLessThanOrEqual(logicalWidth - config.crystal.size);
  });

  test('selects crystal type at exact purple threshold', () => {
    const threshold = config.crystal.thresholds.purple;
    const crystal = createCrystalEntity(360, 2, threshold);
    
    expect(crystal).toBeDefined();
    // Should have purple crystals available (but might still pick cyan)
    const hasPurple = crystal.type.color === 'purple' || crystal.type.color === 'cyan';
    expect(hasPurple).toBe(true);
  });

  test('selects crystal type at exact gold threshold', () => {
    const threshold = config.crystal.thresholds.gold;
    const crystal = createCrystalEntity(360, 2, threshold);
    
    expect(crystal).toBeDefined();
    // Should have gold crystals available
    const validColors = ['cyan', 'purple', 'gold'];
    expect(validColors.includes(crystal.type.color)).toBe(true);
  });

  test('selects crystal type at exact rainbow threshold', () => {
    const threshold = config.crystal.thresholds.rainbow;
    const crystal = createCrystalEntity(360, 2, threshold);
    
    expect(crystal).toBeDefined();
    // Should have rainbow crystals available
    const validColors = ['cyan', 'purple', 'gold', 'rainbow'];
    expect(validColors.includes(crystal.type.color)).toBe(true);
  });

  test('handles crystal with zero gameSpeed', () => {
    const crystal = createCrystalEntity(360, 0, 0);
    
    expect(crystal).toBeDefined();
    expect(crystal.speed).toBeGreaterThanOrEqual(0);
    expect(crystal.speed).toBeLessThanOrEqual(2); // gameSpeed + random * 2
  });

  test('handles crystal with negative gameSpeed', () => {
    const crystal = createCrystalEntity(360, -5, 0);
    
    expect(crystal).toBeDefined();
    // Speed could be negative if gameSpeed is very negative
    expect(crystal.speed).toBeDefined();
  });

  test('handles crystal with extreme gameSpeed', () => {
    const crystal = createCrystalEntity(360, 100, 0);
    
    expect(crystal).toBeDefined();
    expect(crystal.speed).toBeGreaterThanOrEqual(100);
  });

  test('handles crystal with very large score', () => {
    const crystal = createCrystalEntity(360, 2, 1000000);
    
    expect(crystal).toBeDefined();
    // Should have all crystal types available
    const validColors = ['cyan', 'purple', 'gold', 'rainbow'];
    expect(validColors.includes(crystal.type.color)).toBe(true);
  });

  test('handles crystal with negative score', () => {
    const crystal = createCrystalEntity(360, 2, -100);
    
    expect(crystal).toBeDefined();
    // Should only have cyan (score < thresholds)
    expect(crystal.type.color).toBe('cyan');
  });

  test('creates crystal with valid glow value', () => {
    const crystal = createCrystalEntity(360, 2, 0);
    
    expect(crystal.glow).toBeGreaterThanOrEqual(0.5);
    expect(crystal.glow).toBeLessThanOrEqual(1.0);
  });

  test('creates crystal with valid hueOffset', () => {
    const crystal = createCrystalEntity(360, 2, 0);
    
    expect(crystal.hueOffset).toBeGreaterThanOrEqual(0);
    expect(crystal.hueOffset).toBeLessThan(360);
  });

  test('handles crystal creation when logicalWidth equals crystal size', () => {
    const size = config.crystal.size;
    const crystal = createCrystalEntity(size, 2, 0);
    
    expect(crystal.x).toBeGreaterThanOrEqual(0);
    expect(crystal.x).toBeLessThanOrEqual(size - size); // Should be 0
  });

  test('respects ENABLE_CRYSTAL_PURPLE feature flag', () => {
    const originalValue = config.features.ENABLE_CRYSTAL_PURPLE;
    const highScore = config.crystal.thresholds.purple + 1000;
    
    // Test with flag enabled (default)
    config.features.ENABLE_CRYSTAL_PURPLE = true;
    const crystalsEnabled: string[] = [];
    for (let i = 0; i < 100; i++) {
      const crystal = createCrystalEntity(360, 2, highScore);
      crystalsEnabled.push(crystal.type.color);
    }
    expect(crystalsEnabled.some(c => c === 'purple')).toBe(true);
    
    // Test with flag disabled
    config.features.ENABLE_CRYSTAL_PURPLE = false;
    const crystalsDisabled: string[] = [];
    for (let i = 0; i < 100; i++) {
      const crystal = createCrystalEntity(360, 2, highScore);
      crystalsDisabled.push(crystal.type.color);
    }
    expect(crystalsDisabled.some(c => c === 'purple')).toBe(false);
    
    // Restore original value
    config.features.ENABLE_CRYSTAL_PURPLE = originalValue;
  });

  test('respects ENABLE_CRYSTAL_GOLD feature flag', () => {
    const originalValue = config.features.ENABLE_CRYSTAL_GOLD;
    const highScore = config.crystal.thresholds.gold + 1000;
    
    // Test with flag enabled (default)
    config.features.ENABLE_CRYSTAL_GOLD = true;
    const crystalsEnabled: string[] = [];
    for (let i = 0; i < 100; i++) {
      const crystal = createCrystalEntity(360, 2, highScore);
      crystalsEnabled.push(crystal.type.color);
    }
    expect(crystalsEnabled.some(c => c === 'gold')).toBe(true);
    
    // Test with flag disabled
    config.features.ENABLE_CRYSTAL_GOLD = false;
    const crystalsDisabled: string[] = [];
    for (let i = 0; i < 100; i++) {
      const crystal = createCrystalEntity(360, 2, highScore);
      crystalsDisabled.push(crystal.type.color);
    }
    expect(crystalsDisabled.some(c => c === 'gold')).toBe(false);
    
    // Restore original value
    config.features.ENABLE_CRYSTAL_GOLD = originalValue;
  });

  test('respects ENABLE_CRYSTAL_RAINBOW feature flag', () => {
    const originalValue = config.features.ENABLE_CRYSTAL_RAINBOW;
    const highScore = config.crystal.thresholds.rainbow + 1000;
    
    // Test with flag enabled (default)
    config.features.ENABLE_CRYSTAL_RAINBOW = true;
    const crystalsEnabled: string[] = [];
    for (let i = 0; i < 200; i++) { // Rainbow is rare, need more samples
      const crystal = createCrystalEntity(360, 2, highScore);
      crystalsEnabled.push(crystal.type.color);
    }
    expect(crystalsEnabled.some(c => c === 'rainbow')).toBe(true);
    
    // Test with flag disabled
    config.features.ENABLE_CRYSTAL_RAINBOW = false;
    const crystalsDisabled: string[] = [];
    for (let i = 0; i < 200; i++) {
      const crystal = createCrystalEntity(360, 2, highScore);
      crystalsDisabled.push(crystal.type.color);
    }
    expect(crystalsDisabled.some(c => c === 'rainbow')).toBe(false);
    
    // Restore original value
    config.features.ENABLE_CRYSTAL_RAINBOW = originalValue;
  });

  test('falls back to cyan when all crystal types are disabled', () => {
    const originalCyan = config.features.ENABLE_CRYSTAL_CYAN;
    const originalPurple = config.features.ENABLE_CRYSTAL_PURPLE;
    const originalGold = config.features.ENABLE_CRYSTAL_GOLD;
    const originalRainbow = config.features.ENABLE_CRYSTAL_RAINBOW;
    
    // Disable all crystal types
    config.features.ENABLE_CRYSTAL_CYAN = false;
    config.features.ENABLE_CRYSTAL_PURPLE = false;
    config.features.ENABLE_CRYSTAL_GOLD = false;
    config.features.ENABLE_CRYSTAL_RAINBOW = false;
    
    const crystal = createCrystalEntity(360, 2, 1000000);
    // Should fallback to cyan even though it's disabled
    expect(crystal.type.color).toBe('cyan');
    
    // Restore original values
    config.features.ENABLE_CRYSTAL_CYAN = originalCyan;
    config.features.ENABLE_CRYSTAL_PURPLE = originalPurple;
    config.features.ENABLE_CRYSTAL_GOLD = originalGold;
    config.features.ENABLE_CRYSTAL_RAINBOW = originalRainbow;
  });

  test('respects spawn weights configuration', () => {
    const highScore = config.crystal.thresholds.rainbow + 1000;
    const originalWeights = { ...config.crystal.spawnWeights };
    
    // Set custom weights: cyan=1, purple=2, gold=3, rainbow=1
    // Expected distribution: cyan=1/7, purple=2/7, gold=3/7, rainbow=1/7
    config.crystal.spawnWeights.cyan = 1;
    config.crystal.spawnWeights.purple = 2;
    config.crystal.spawnWeights.gold = 3;
    config.crystal.spawnWeights.rainbow = 1;
    
    const counts: Record<string, number> = { cyan: 0, purple: 0, gold: 0, rainbow: 0 };
    const samples = 1000;
    
    for (let i = 0; i < samples; i++) {
      const crystal = createCrystalEntity(360, 2, highScore);
      counts[crystal.type.color]++;
    }
    
    // Verify all types appear (with some tolerance for randomness)
    expect(counts.cyan).toBeGreaterThan(0);
    expect(counts.purple).toBeGreaterThan(0);
    expect(counts.gold).toBeGreaterThan(0);
    expect(counts.rainbow).toBeGreaterThan(0);
    
    // Verify relative weights: gold should be most common, purple second, cyan and rainbow least
    expect(counts.gold).toBeGreaterThan(counts.purple);
    expect(counts.purple).toBeGreaterThan(counts.cyan);
    expect(counts.purple).toBeGreaterThan(counts.rainbow);
    
    // Restore original weights
    config.crystal.spawnWeights = originalWeights;
  });

  test('spawn weights of 0 prevent crystal type from spawning', () => {
    const highScore = config.crystal.thresholds.gold + 1000;
    const originalGoldWeight = config.crystal.spawnWeights.gold;
    
    // Set gold weight to 0
    config.crystal.spawnWeights.gold = 0;
    
    const crystals: string[] = [];
    for (let i = 0; i < 200; i++) {
      const crystal = createCrystalEntity(360, 2, highScore);
      crystals.push(crystal.type.color);
    }
    
    // Gold should never appear
    expect(crystals.some(c => c === 'gold')).toBe(false);
    
    // Restore original weight
    config.crystal.spawnWeights.gold = originalGoldWeight;
  });
});

describe('createMeteorEntity', () => {
  test('creates meteor with valid parameters', () => {
    const meteor = createMeteorEntity(360, 2);
    
    expect(meteor).toBeDefined();
    expect(meteor.width).toBe(config.meteor.size);
    expect(meteor.height).toBe(config.meteor.size);
    expect(meteor.y).toBe(-config.meteor.size);
    expect(meteor.rotation).toBe(0);
    expect(meteor.pulse).toBe(0);
  });

  test('handles meteor creation with zero logicalWidth', () => {
    const meteor = createMeteorEntity(0, 2);
    
    expect(meteor).toBeDefined();
    expect(meteor.x).toBeLessThanOrEqual(0);
  });

  test('handles meteor creation with negative logicalWidth', () => {
    const meteor = createMeteorEntity(-100, 2);
    
    expect(meteor).toBeDefined();
    expect(meteor.x).toBeLessThanOrEqual(0);
  });

  test('handles meteor creation at screen boundaries', () => {
    const logicalWidth = config.meteor.size;
    const meteor = createMeteorEntity(logicalWidth, 2);
    
    expect(meteor.x).toBeGreaterThanOrEqual(0);
    expect(meteor.x).toBeLessThanOrEqual(logicalWidth - config.meteor.size);
  });

  test('handles meteor with zero gameSpeed', () => {
    const meteor = createMeteorEntity(360, 0);
    
    expect(meteor).toBeDefined();
    expect(meteor.speed).toBeGreaterThanOrEqual(0);
    expect(meteor.speed).toBeLessThanOrEqual(3); // gameSpeed + random * 3
  });

  test('handles meteor with negative gameSpeed', () => {
    const meteor = createMeteorEntity(360, -5);
    
    expect(meteor).toBeDefined();
    // Speed could be negative
    expect(meteor.speed).toBeDefined();
  });

  test('handles meteor with extreme gameSpeed', () => {
    const meteor = createMeteorEntity(360, 100);
    
    expect(meteor).toBeDefined();
    expect(meteor.speed).toBeGreaterThanOrEqual(100);
  });

  test('creates meteor with valid speed range', () => {
    const meteor = createMeteorEntity(360, 2);
    
    expect(meteor.speed).toBeGreaterThanOrEqual(2);
    expect(meteor.speed).toBeLessThanOrEqual(5); // 2 + random * 3
  });
});

describe('createCatEntity', () => {
  test('creates cat with valid parameters', () => {
    const cat = createCatEntity(360, 2);
    
    expect(cat).toBeDefined();
    expect(cat.width).toBe(config.cat.size);
    expect(cat.height).toBe(config.cat.size);
    expect(cat.y).toBe(-config.cat.size);
    expect(['tabby', 'neon', 'shadow']).toContain(cat.pattern);
  });

  test('handles cat creation with zero logicalWidth', () => {
    const cat = createCatEntity(0, 2);
    
    expect(cat).toBeDefined();
    expect(cat.x).toBeLessThanOrEqual(0);
  });

  test('handles cat creation with negative logicalWidth', () => {
    const cat = createCatEntity(-100, 2);
    
    expect(cat).toBeDefined();
    expect(cat.x).toBeLessThanOrEqual(0);
  });

  test('handles cat creation at screen boundaries', () => {
    const logicalWidth = config.cat.size;
    const cat = createCatEntity(logicalWidth, 2);
    
    expect(cat.x).toBeGreaterThanOrEqual(0);
    expect(cat.x).toBeLessThanOrEqual(logicalWidth - config.cat.size);
  });

  test('handles cat with zero gameSpeed', () => {
    const cat = createCatEntity(360, 0);
    
    expect(cat).toBeDefined();
    expect(cat.speed).toBeGreaterThanOrEqual(0);
  });

  test('handles cat with negative gameSpeed', () => {
    const cat = createCatEntity(360, -5);
    
    expect(cat).toBeDefined();
    expect(cat.speed).toBeDefined();
  });

  test('handles cat with extreme gameSpeed', () => {
    const cat = createCatEntity(360, 100);
    
    expect(cat).toBeDefined();
    expect(cat.speed).toBeGreaterThanOrEqual(100);
  });

  test('creates cat with valid pattern', () => {
    const patterns = ['tabby', 'neon', 'shadow'];
    const cat = createCatEntity(360, 2);
    
    expect(patterns).toContain(cat.pattern);
  });

  test('creates cat with valid hue', () => {
    const cat = createCatEntity(360, 2);
    
    expect(cat.hue).toBeGreaterThanOrEqual(0);
    expect(cat.hue).toBeLessThan(360);
  });

  test('creates cat with valid wobble', () => {
    const cat = createCatEntity(360, 2);
    
    expect(cat.wobble).toBeGreaterThanOrEqual(0);
    expect(cat.wobble).toBeLessThan(Math.PI * 2);
  });

  test('creates cat with valid speed range', () => {
    const cat = createCatEntity(360, 2);
    const minSpeed = 2 + config.cat.speedMinBonus;
    const maxSpeed = 2 + config.cat.speedMaxBonus;
    
    expect(cat.speed).toBeGreaterThanOrEqual(minSpeed);
    expect(cat.speed).toBeLessThanOrEqual(maxSpeed);
  });
});
