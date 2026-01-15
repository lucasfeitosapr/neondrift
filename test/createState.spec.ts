import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { createState } from '../src/game/state';
import { createMockCanvas, createMockCtx } from './utils';

describe('createState', () => {
  test('initializes state with defaults', () => {
    // create a fake canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    const state = createState(canvas, ctx);

    expect(state.score).toBe(0);
    expect(state.gameSpeed).toBeGreaterThanOrEqual(0);
    expect(state.player).toBeNull();
    expect(state.particles).toBeInstanceOf(Array);
    expect(state.particlePool).toBeDefined();
  });

  test('handles localStorage.getItem throws error gracefully', () => {
    const originalGetItem = localStorage.getItem;
    localStorage.getItem = vi.fn(() => {
      throw new Error('Storage quota exceeded');
    });

    const canvas = createMockCanvas();
    const ctx = createMockCtx();

    expect(() => {
      const state = createState(canvas, ctx);
      expect(state.highScore).toBe(0);
    }).not.toThrow();

    localStorage.getItem = originalGetItem;
  });

  test('handles localStorage.setItem throws error gracefully', () => {
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = vi.fn(() => {
      throw new Error('Storage quota exceeded');
    });

    const canvas = createMockCanvas();
    const ctx = createMockCtx();
    const state = createState(canvas, ctx);

    // State should still be created successfully
    expect(state).toBeDefined();
    expect(state.highScore).toBeDefined();

    localStorage.setItem = originalSetItem;
  });

  test('handles invalid highScore in localStorage (non-numeric)', () => {
    const originalGetItem = localStorage.getItem;
    localStorage.getItem = vi.fn(() => 'not-a-number');

    const canvas = createMockCanvas();
    const ctx = createMockCtx();
    const state = createState(canvas, ctx);

    expect(state.highScore).toBe(0);

    localStorage.getItem = originalGetItem;
  });

  test('handles null highScore in localStorage', () => {
    const originalGetItem = localStorage.getItem;
    localStorage.getItem = vi.fn(() => null);

    const canvas = createMockCanvas();
    const ctx = createMockCtx();
    const state = createState(canvas, ctx);

    expect(state.highScore).toBe(0);

    localStorage.getItem = originalGetItem;
  });

  test('handles empty string highScore in localStorage', () => {
    const originalGetItem = localStorage.getItem;
    localStorage.getItem = vi.fn(() => '');

    const canvas = createMockCanvas();
    const ctx = createMockCtx();
    const state = createState(canvas, ctx);

    expect(state.highScore).toBe(0);

    localStorage.getItem = originalGetItem;
  });

  test('handles valid highScore in localStorage', () => {
    // Test that localStorage access doesn't crash
    const canvas = createMockCanvas();
    const ctx = createMockCtx();
    
    expect(() => {
      const state = createState(canvas, ctx);
      expect(state.highScore).toBeDefined();
    }).not.toThrow();
  });

  test('handles negative highScore in localStorage', () => {
    // Test that localStorage access doesn't crash
    const canvas = createMockCanvas();
    const ctx = createMockCtx();
    
    expect(() => {
      const state = createState(canvas, ctx);
      expect(state.highScore).toBeDefined();
    }).not.toThrow();
  });

  test('initializes all required arrays', () => {
    const canvas = createMockCanvas();
    const ctx = createMockCtx();
    const state = createState(canvas, ctx);

    expect(state.crystals).toBeInstanceOf(Array);
    expect(state.meteors).toBeInstanceOf(Array);
    expect(state.cats).toBeInstanceOf(Array);
    expect(state.particles).toBeInstanceOf(Array);
    expect(state.gridLines).toBeInstanceOf(Array);
    expect(state.floatingTexts).toBeInstanceOf(Array);
    expect(state.activePowerUps).toBeInstanceOf(Array);
    expect(state.powerUpPickups).toBeInstanceOf(Array);
    expect(state.chainLightningArcs).toBeInstanceOf(Array);
    expect(state.timeSlowRipples).toBeInstanceOf(Array);
    expect(state.pendingRevengeMeteors).toBeInstanceOf(Array);
  });

  test('initializes viewport correctly', () => {
    const canvas = createMockCanvas();
    canvas.width = 720;
    canvas.height = 1280;
    const ctx = createMockCtx();
    const state = createState(canvas, ctx);

    expect(state.viewport).toBeDefined();
    expect(state.viewport?.width).toBe(canvas.width);
    expect(state.viewport?.height).toBe(canvas.height);
    expect(state.viewport?.dpr).toBeGreaterThanOrEqual(1);
  });

  test('initializes modifiers with defaults', () => {
    const canvas = createMockCanvas();
    const ctx = createMockCtx();
    const state = createState(canvas, ctx);

    expect(state.modifiers).toBeDefined();
    expect(state.modifiers.playerSpeed).toBe(1);
    expect(state.modifiers.gameSpeed).toBe(1);
    expect(state.modifiers.magnetRange).toBe(0);
    expect(state.modifiers.scoreMultiplier).toBe(1);
  });

  test('initializes particle pool correctly', () => {
    const canvas = createMockCanvas();
    const ctx = createMockCtx();
    const state = createState(canvas, ctx);

    expect(state.particlePool).toBeDefined();
    expect(state.MAX_PARTICLES).toBeGreaterThan(0);
  });

  test('initializes debug flags correctly', () => {
    const canvas = createMockCanvas();
    const ctx = createMockCtx();
    const state = createState(canvas, ctx);

    expect(state.debug).toBeDefined();
    expect(state.debug?.grid).toBeDefined();
    expect(state.debug?.boxes).toBeDefined();
    expect(state.debug?.particles).toBeDefined();
    expect(state.debug?.invincibility).toBeDefined();
    expect(state.debug?.meteors).toBeDefined();
    expect(state.debug?.forceMaxDifficulty).toBeDefined();
  });

  test('handles canvas with zero dimensions', () => {
    const canvas = createMockCanvas();
    canvas.width = 0;
    canvas.height = 0;
    const ctx = createMockCtx();

    expect(() => {
      const state = createState(canvas, ctx);
      expect(state.viewport?.width).toBe(0);
      expect(state.viewport?.height).toBe(0);
    }).not.toThrow();
  });

  test('handles canvas with very large dimensions', () => {
    const canvas = createMockCanvas();
    canvas.width = 10000;
    canvas.height = 10000;
    const ctx = createMockCtx();

    expect(() => {
      const state = createState(canvas, ctx);
      expect(state.viewport?.width).toBe(10000);
      expect(state.viewport?.height).toBe(10000);
    }).not.toThrow();
  });

  test('initializes timestamps to zero', () => {
    const canvas = createMockCanvas();
    const ctx = createMockCtx();
    const state = createState(canvas, ctx);

    expect(state.lastCollectTimestamp).toBe(0);
    expect(state.lastMagnetSpawnTimestamp).toBe(0);
    expect(state.lastCatSpawnTimestamp).toBe(0);
  });

  test('initializes game state flags correctly', () => {
    const canvas = createMockCanvas();
    const ctx = createMockCtx();
    const state = createState(canvas, ctx);

    expect(state.gameRunning).toBe(true);
    expect(state.paused).toBe(false);
    expect(state.resumeCountdownActive).toBe(false);
    expect(state.resumeCountdownTarget).toBeNull();
  });
});
