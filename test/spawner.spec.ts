import { describe, test, expect } from 'vitest';
import { spawnCrystal, spawnMeteor, spawnCat, spawnRevengeMeteor } from '../src/game/spawner';
import { createMockState, createMockCanvas, createMockCtx } from './utils';
import { GameState } from '../src/game/types';
import { config } from '../src/game/config';

describe('spawnCrystal', () => {
  test('spawns crystal with viewport width', () => {
    const state = {
      ...createMockState(),
      canvas: createMockCanvas(),
      viewport: { width: 400, height: 600, dpr: 1 },
      gameSpeed: 2,
      score: 0,
      crystals: []
    } as GameState;

    spawnCrystal(state);

    expect(state.crystals).toHaveLength(1);
    expect(state.crystals[0].x).toBeGreaterThanOrEqual(0);
    expect(state.crystals[0].x).toBeLessThanOrEqual(400 - config.crystal.size);
  });

  test('spawns crystal when viewport is undefined', () => {
    const canvas = createMockCanvas();
    canvas.width = 360;
    const state = {
      ...createMockState(),
      canvas,
      viewport: undefined,
      gameSpeed: 2,
      score: 0,
      crystals: []
    } as GameState;

    spawnCrystal(state);

    expect(state.crystals).toHaveLength(1);
    expect(state.crystals[0].x).toBeGreaterThanOrEqual(0);
    expect(state.crystals[0].x).toBeLessThanOrEqual(360 - config.crystal.size);
  });

  test('spawns crystal when canvas.width is 0', () => {
    const canvas = createMockCanvas();
    canvas.width = 0;
    const state = {
      ...createMockState(),
      canvas,
      viewport: undefined,
      gameSpeed: 2,
      score: 0,
      crystals: []
    } as GameState;

    expect(() => {
      spawnCrystal(state);
    }).not.toThrow();

    expect(state.crystals).toHaveLength(1);
  });

  test('spawns crystal with correct score', () => {
    const state = {
      ...createMockState(),
      canvas: createMockCanvas(),
      viewport: { width: 400, height: 600, dpr: 1 },
      gameSpeed: 2,
      score: config.crystal.thresholds.purple,
      crystals: []
    } as GameState;

    spawnCrystal(state);

    expect(state.crystals).toHaveLength(1);
    // Should have purple crystals available
    const validColors = ['cyan', 'purple'];
    expect(validColors.includes(state.crystals[0].type.color)).toBe(true);
  });

  test('adds crystal to existing array', () => {
    const state = {
      ...createMockState(),
      canvas: createMockCanvas(),
      viewport: { width: 400, height: 600, dpr: 1 },
      gameSpeed: 2,
      score: 0,
      crystals: []
    } as GameState;

    spawnCrystal(state);
    spawnCrystal(state);
    spawnCrystal(state);

    expect(state.crystals).toHaveLength(3);
  });
});

describe('spawnMeteor', () => {
  test('spawns meteor with viewport width', () => {
    const state = {
      ...createMockState(),
      canvas: createMockCanvas(),
      viewport: { width: 400, height: 600, dpr: 1 },
      gameSpeed: 2,
      meteors: []
    } as GameState;

    spawnMeteor(state);

    expect(state.meteors).toHaveLength(1);
    expect(state.meteors[0].x).toBeGreaterThanOrEqual(0);
    expect(state.meteors[0].x).toBeLessThanOrEqual(400 - config.meteor.size);
  });

  test('spawns meteor when viewport is undefined', () => {
    const canvas = createMockCanvas();
    canvas.width = 360;
    const state = {
      ...createMockState(),
      canvas,
      viewport: undefined,
      gameSpeed: 2,
      meteors: []
    } as GameState;

    spawnMeteor(state);

    expect(state.meteors).toHaveLength(1);
    expect(state.meteors[0].x).toBeGreaterThanOrEqual(0);
    expect(state.meteors[0].x).toBeLessThanOrEqual(360 - config.meteor.size);
  });

  test('spawns meteor when canvas.width is 0', () => {
    const canvas = createMockCanvas();
    canvas.width = 0;
    const state = {
      ...createMockState(),
      canvas,
      viewport: undefined,
      gameSpeed: 2,
      meteors: []
    } as GameState;

    expect(() => {
      spawnMeteor(state);
    }).not.toThrow();

    expect(state.meteors).toHaveLength(1);
  });

  test('adds meteor to existing array', () => {
    const state = {
      ...createMockState(),
      canvas: createMockCanvas(),
      viewport: { width: 400, height: 600, dpr: 1 },
      gameSpeed: 2,
      meteors: []
    } as GameState;

    spawnMeteor(state);
    spawnMeteor(state);

    expect(state.meteors).toHaveLength(2);
  });
});

describe('spawnCat', () => {
  test('spawns cat with viewport width', () => {
    const state = {
      ...createMockState(),
      canvas: createMockCanvas(),
      viewport: { width: 400, height: 600, dpr: 1 },
      gameSpeed: 2,
      cats: []
    } as GameState;

    const cat = spawnCat(state);

    expect(state.cats).toHaveLength(1);
    expect(cat).toBeDefined();
    expect(cat.x).toBeGreaterThanOrEqual(0);
    expect(cat.x).toBeLessThanOrEqual(400 - config.cat.size);
  });

  test('spawns cat when viewport is undefined', () => {
    const canvas = createMockCanvas();
    canvas.width = 360;
    const state = {
      ...createMockState(),
      canvas,
      viewport: undefined,
      gameSpeed: 2,
      cats: []
    } as GameState;

    const cat = spawnCat(state);

    expect(state.cats).toHaveLength(1);
    expect(cat).toBeDefined();
    expect(cat.x).toBeGreaterThanOrEqual(0);
    expect(cat.x).toBeLessThanOrEqual(360 - config.cat.size);
  });

  test('spawns cat when canvas.width is 0', () => {
    const canvas = createMockCanvas();
    canvas.width = 0;
    const state = {
      ...createMockState(),
      canvas,
      viewport: undefined,
      gameSpeed: 2,
      cats: []
    } as GameState;

    expect(() => {
      const cat = spawnCat(state);
      expect(cat).toBeDefined();
    }).not.toThrow();

    expect(state.cats).toHaveLength(1);
  });

  test('returns spawned cat', () => {
    const state = {
      ...createMockState(),
      canvas: createMockCanvas(),
      viewport: { width: 400, height: 600, dpr: 1 },
      gameSpeed: 2,
      cats: []
    } as GameState;

    const cat = spawnCat(state);

    expect(cat).toBe(state.cats[0]);
  });

  test('adds cat to existing array', () => {
    const state = {
      ...createMockState(),
      canvas: createMockCanvas(),
      viewport: { width: 400, height: 600, dpr: 1 },
      gameSpeed: 2,
      cats: []
    } as GameState;

    spawnCat(state);
    spawnCat(state);
    spawnCat(state);

    expect(state.cats).toHaveLength(3);
  });
});

describe('spawnRevengeMeteor', () => {
  test('spawns revenge meteor at target position', () => {
    const state = {
      ...createMockState(),
      canvas: createMockCanvas(),
      meteors: []
    } as GameState;

    const targetX = 200;
    const targetY = 300;
    const speed = 5;

    const meteor = spawnRevengeMeteor(state, targetX, targetY, speed);

    expect(state.meteors).toHaveLength(1);
    expect(meteor).toBeDefined();
    expect(meteor.x).toBe(targetX - config.meteor.size / 2);
    expect(meteor.y).toBe(-config.meteor.size);
    expect(meteor.speed).toBe(speed);
  });

  test('spawns revenge meteor with zero targetX', () => {
    const state = {
      ...createMockState(),
      canvas: createMockCanvas(),
      meteors: []
    } as GameState;

    const meteor = spawnRevengeMeteor(state, 0, 0, 5);

    expect(meteor.x).toBe(-config.meteor.size / 2);
  });

  test('spawns revenge meteor with negative targetX', () => {
    const state = {
      ...createMockState(),
      canvas: createMockCanvas(),
      meteors: []
    } as GameState;

    const meteor = spawnRevengeMeteor(state, -100, 0, 5);

    expect(meteor.x).toBe(-100 - config.meteor.size / 2);
  });

  test('spawns revenge meteor with very large targetX', () => {
    const state = {
      ...createMockState(),
      canvas: createMockCanvas(),
      meteors: []
    } as GameState;

    const meteor = spawnRevengeMeteor(state, 10000, 0, 5);

    expect(meteor.x).toBe(10000 - config.meteor.size / 2);
  });

  test('spawns revenge meteor with zero speed', () => {
    const state = {
      ...createMockState(),
      canvas: createMockCanvas(),
      meteors: []
    } as GameState;

    const meteor = spawnRevengeMeteor(state, 200, 300, 0);

    expect(meteor.speed).toBe(0);
  });

  test('spawns revenge meteor with negative speed', () => {
    const state = {
      ...createMockState(),
      canvas: createMockCanvas(),
      meteors: []
    } as GameState;

    const meteor = spawnRevengeMeteor(state, 200, 300, -5);

    expect(meteor.speed).toBe(-5);
  });

  test('adds revenge meteor to existing array', () => {
    const state = {
      ...createMockState(),
      canvas: createMockCanvas(),
      meteors: []
    } as GameState;

    spawnRevengeMeteor(state, 100, 200, 5);
    spawnRevengeMeteor(state, 200, 300, 5);
    spawnRevengeMeteor(state, 300, 400, 5);

    expect(state.meteors).toHaveLength(3);
  });

  test('spawns revenge meteor with correct properties', () => {
    const state = {
      ...createMockState(),
      canvas: createMockCanvas(),
      meteors: []
    } as GameState;

    const meteor = spawnRevengeMeteor(state, 200, 300, 5);

    expect(meteor.width).toBe(config.meteor.size);
    expect(meteor.height).toBe(config.meteor.size);
    expect(meteor.rotation).toBe(0);
    expect(meteor.pulse).toBe(0);
  });
});
