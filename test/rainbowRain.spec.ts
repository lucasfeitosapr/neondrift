import { describe, test, expect, beforeEach } from 'vitest';
import { createMockState, createMockCanvas } from './utils';
import { activateRainbowRain, tickRainbowRain } from '../src/game/events/rainbowRain';
import { config } from '../src/game/config';
import { GameState } from '../src/game/types';

describe('Rainbow Rain Event', () => {
  let state: GameState;

  beforeEach(() => {
    // Reset config to defaults
    config.rainbowRain.DURATION_MS = 3000;
    config.rainbowRain.SPAWN_INTERVAL_MS = 200;
    config.rainbowRain.CRYSTALS_PER_WAVE = 5;
    
    // Create a proper GameState
    const canvas = createMockCanvas();
    const ctx = canvas.getContext('2d')!;
    state = {
      ...createMockState(),
      canvas,
      ctx,
      crystals: [],
      activeRainbowRain: undefined
    } as GameState;
  });

  test('should activate rainbow rain event', () => {
    const now = performance.now();

    activateRainbowRain(state, now);

    expect(state.activeRainbowRain).toBeDefined();
    expect(state.activeRainbowRain?.startedAt).toBe(now);
    expect(state.activeRainbowRain?.expiresAt).toBe(now + config.rainbowRain.DURATION_MS);
    expect(state.activeRainbowRain?.lastSpawnAt).toBe(now);
  });

  test('should expire rainbow rain after duration', () => {
    const now = performance.now();
    const duration = config.rainbowRain.DURATION_MS;

    activateRainbowRain(state, now);
    
    // Should still be active before expiration
    tickRainbowRain(state, now + duration - 100, 16);
    expect(state.activeRainbowRain).toBeDefined();

    // Should expire after duration
    tickRainbowRain(state, now + duration + 100, 16);
    expect(state.activeRainbowRain).toBeUndefined();
  });

  test('should spawn rainbow crystals at intervals', () => {
    const now = performance.now();

    activateRainbowRain(state, now);
    
    // Initial crystal count
    const initialCrystals = state.crystals.length;

    // Tick past spawn interval
    tickRainbowRain(state, now + config.rainbowRain.SPAWN_INTERVAL_MS + 50, 16);
    
    // Should have spawned new crystals
    expect(state.crystals.length).toBeGreaterThan(initialCrystals);
    
    // All spawned crystals should be rainbow type
    const newCrystals = state.crystals.slice(initialCrystals);
    newCrystals.forEach(crystal => {
      expect(crystal.type.color).toBe('rainbow');
    });
  });

  test('should not spawn crystals if interval has not passed', () => {
    const now = performance.now();

    activateRainbowRain(state, now);
    
    const initialCrystals = state.crystals.length;

    // Tick before spawn interval
    tickRainbowRain(state, now + config.rainbowRain.SPAWN_INTERVAL_MS - 50, 16);
    
    // Should not have spawned new crystals
    expect(state.crystals.length).toBe(initialCrystals);
  });

  test('should handle multiple rainbow rain activations', () => {
    const now = performance.now();

    activateRainbowRain(state, now);
    const firstExpiresAt = state.activeRainbowRain?.expiresAt;

    // Activate again before first expires
    activateRainbowRain(state, now + 1000);
    
    // Should refresh the timer
    expect(state.activeRainbowRain?.expiresAt).toBeGreaterThan(firstExpiresAt!);
    expect(state.activeRainbowRain?.startedAt).toBe(now + 1000);
  });

  test('should not spawn crystals when rainbow crystals are disabled', () => {
    // Disable rainbow crystals
    config.features.ENABLE_CRYSTAL_RAINBOW = false;
    
    const now = performance.now();
    activateRainbowRain(state, now);
    
    const initialCrystals = state.crystals.length;
    
    // Tick past spawn interval
    tickRainbowRain(state, now + config.rainbowRain.SPAWN_INTERVAL_MS + 50, 16);
    
    // Should not have spawned new crystals
    expect(state.crystals.length).toBe(initialCrystals);
    
    // Re-enable for other tests
    config.features.ENABLE_CRYSTAL_RAINBOW = true;
  });

  test('should spawn crystals with correct properties', () => {
    const now = performance.now();
    activateRainbowRain(state, now);
    
    // Tick past spawn interval
    tickRainbowRain(state, now + config.rainbowRain.SPAWN_INTERVAL_MS + 50, 16);
    
    // Should have spawned exactly CRYSTALS_PER_WAVE crystals
    expect(state.crystals.length).toBe(config.rainbowRain.CRYSTALS_PER_WAVE);
    
    // All crystals should have correct properties
    state.crystals.forEach(crystal => {
      expect(crystal.type.color).toBe('rainbow');
      expect(crystal.type.points).toBe(50);
      expect(crystal.width).toBe(25); // config.crystal.size
      expect(crystal.height).toBe(25);
      expect(crystal.speed).toBeGreaterThan(0);
      expect(crystal.speed).toBeLessThan(5); // Should use speed multiplier
      expect(crystal.y).toBeLessThan(0); // Should start above screen
    });
  });
});
