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
