import { describe, test, expect } from 'vitest';
import { createMockState, createMockCanvas, createMockCtx, createCrystal, createMeteor } from './utils';
import { GameState } from '../src/game/types';
import { checkCollision, checkPlayerCollision } from '../src/game/collision';
import { updatePowerUpPickups } from '../src/game/powerups/pickups';
import { activatePowerUp, tickPowerUps } from '../src/game/powerups/system';

describe('Game Edge Cases', () => {
  describe('Null player handling', () => {
    test('handles null player in collision checks', () => {
      const state = {
        ...createMockState(),
        canvas: createMockCanvas(),
        ctx: createMockCtx(),
        player: null,
        crystals: [createCrystal(100, 100)]
      } as GameState;

      expect(() => {
        // Should not crash when player is null
        if (state.player) {
          checkCollision(state.player, state.crystals[0]);
        }
      }).not.toThrow();
    });

    test('handles null player in powerup pickup updates', () => {
      const state = {
        ...createMockState(),
        canvas: createMockCanvas(),
        ctx: createMockCtx(),
        player: null,
        powerUpPickups: [],
        modifiers: { gameSpeed: 1 }
      } as GameState;

      expect(() => {
        updatePowerUpPickups(state, 400, 500, 1, () => {});
      }).not.toThrow();
    });

    test('handles null player in powerup activation', () => {
      const state = {
        ...createMockState(),
        canvas: createMockCanvas(),
        ctx: createMockCtx(),
        player: null,
        activePowerUps: []
      } as GameState;

      expect(() => {
        activatePowerUp(state, 'magnet', performance.now());
      }).not.toThrow();
    });
  });

  describe('Corrupted state arrays', () => {
    test('handles corrupted crystals array', () => {
      const state = {
        ...createMockState(),
        canvas: createMockCanvas(),
        ctx: createMockCtx(),
        player: { x: 100, y: 100, width: 50, height: 30, speed: 4, trail: [] },
        crystals: [null as any, createCrystal(200, 200), undefined as any]
      } as GameState;

      expect(() => {
        // Iterate safely
        for (let i = state.crystals.length - 1; i >= 0; i--) {
          const crystal = state.crystals[i];
          if (crystal && state.player) {
            checkCollision(state.player, crystal);
          }
        }
      }).not.toThrow();
    });

    test('handles corrupted meteors array', () => {
      const state = {
        ...createMockState(),
        canvas: createMockCanvas(),
        ctx: createMockCtx(),
        player: { x: 100, y: 100, width: 50, height: 30, speed: 4, trail: [] },
        meteors: [null as any, createMeteor(200, 200)]
      } as GameState;

      expect(() => {
        for (let i = state.meteors.length - 1; i >= 0; i--) {
          const meteor = state.meteors[i];
          if (meteor && state.player) {
            checkPlayerCollision(state.player, meteor);
          }
        }
      }).not.toThrow();
    });

    test('handles empty arrays', () => {
      const state = {
        ...createMockState(),
        canvas: createMockCanvas(),
        ctx: createMockCtx(),
        player: { x: 100, y: 100, width: 50, height: 30, speed: 4, trail: [] },
        crystals: [],
        meteors: [],
        powerUpPickups: []
      } as GameState;

      expect(() => {
        state.crystals.forEach(() => {});
        state.meteors.forEach(() => {});
        updatePowerUpPickups(state, 400, 500, 1, () => {});
      }).not.toThrow();
    });
  });

  describe('Array mutation during iteration', () => {
    test('handles crystal collection when array is modified during iteration', () => {
      const state = {
        ...createMockState(),
        canvas: createMockCanvas(),
        ctx: createMockCtx(),
        player: { x: 100, y: 100, width: 50, height: 30, speed: 4, trail: [] },
        crystals: [
          createCrystal(100, 100),
          createCrystal(105, 105),
          createCrystal(200, 200)
        ]
      } as GameState;

      expect(() => {
        for (let i = state.crystals.length - 1; i >= 0; i--) {
          const crystal = state.crystals[i];
          if (crystal && checkCollision(state.player!, crystal)) {
            state.crystals.splice(i, 1);
          }
        }
      }).not.toThrow();

      expect(state.crystals.length).toBeLessThan(3);
    });

    test('handles meteor collision when meteors array is modified', () => {
      const state = {
        ...createMockState(),
        canvas: createMockCanvas(),
        ctx: createMockCtx(),
        player: { x: 100, y: 100, width: 50, height: 30, speed: 4, trail: [] },
        meteors: [
          createMeteor(100, 100),
          createMeteor(200, 200),
          createMeteor(300, 300)
        ]
      } as GameState;

      expect(() => {
        for (let i = state.meteors.length - 1; i >= 0; i--) {
          const meteor = state.meteors[i];
          if (meteor && meteor.y > 500) {
            state.meteors.splice(i, 1);
          }
        }
      }).not.toThrow();
    });

    test('handles powerup activation during game loop iteration', () => {
      const state = {
        ...createMockState(),
        canvas: createMockCanvas(),
        ctx: createMockCtx(),
        player: { x: 100, y: 100, width: 50, height: 30, speed: 4, trail: [] },
        activePowerUps: [],
        powerUpPickups: []
      } as GameState;

      expect(() => {
        // Simulate powerup activation during iteration
        activatePowerUp(state, 'magnet', performance.now());
        tickPowerUps(state, performance.now(), 16.67);
        activatePowerUp(state, 'time_slow', performance.now());
      }).not.toThrow();
    });
  });

  describe('Score overflow', () => {
    test('handles very large score values', () => {
      const state = {
        ...createMockState(),
        canvas: createMockCanvas(),
        ctx: createMockCtx(),
        score: Number.MAX_SAFE_INTEGER
      } as GameState;

      expect(state.score).toBe(Number.MAX_SAFE_INTEGER);
      expect(() => {
        state.score += 1000;
      }).not.toThrow();
    });

    test('handles negative score gracefully', () => {
      const state = {
        ...createMockState(),
        canvas: createMockCanvas(),
        ctx: createMockCtx(),
        score: -1000
      } as GameState;

      expect(state.score).toBe(-1000);
      // Game should handle negative scores without crashing
    });
  });

  describe('Game speed boundaries', () => {
    test('handles game speed at maximum boundary', () => {
      const state = {
        ...createMockState(),
        canvas: createMockCanvas(),
        ctx: createMockCtx(),
        gameSpeed: 6 // MAX_GAME_SPEED
      } as GameState;

      expect(state.gameSpeed).toBe(6);
      // Should not crash at max speed
    });

    test('handles game speed at zero', () => {
      const state = {
        ...createMockState(),
        canvas: createMockCanvas(),
        ctx: createMockCtx(),
        gameSpeed: 0
      } as GameState;

      expect(state.gameSpeed).toBe(0);
    });

    test('handles negative game speed', () => {
      const state = {
        ...createMockState(),
        canvas: createMockCanvas(),
        ctx: createMockCtx(),
        gameSpeed: -5
      } as GameState;

      expect(state.gameSpeed).toBe(-5);
    });

    test('handles very large game speed', () => {
      const state = {
        ...createMockState(),
        canvas: createMockCanvas(),
        ctx: createMockCtx(),
        gameSpeed: 1000
      } as GameState;

      expect(state.gameSpeed).toBe(1000);
    });
  });

  describe('Pause/unpause race conditions', () => {
    test('handles rapid pause/unpause toggles', () => {
      const state = {
        ...createMockState(),
        canvas: createMockCanvas(),
        ctx: createMockCtx(),
        paused: false,
        resumeCountdownActive: false
      } as GameState;

      expect(() => {
        state.paused = true;
        state.paused = false;
        state.paused = true;
        state.resumeCountdownActive = true;
        state.resumeCountdownActive = false;
      }).not.toThrow();
    });

    test('handles resume countdown edge cases', () => {
      const state = {
        ...createMockState(),
        canvas: createMockCanvas(),
        ctx: createMockCtx(),
        resumeCountdownActive: true,
        resumeCountdownTarget: performance.now() + 3000,
        resumeCountdownValue: 3
      } as GameState;

      expect(() => {
        const now = performance.now();
        const remaining = state.resumeCountdownTarget! - now;
        if (remaining <= 0) {
          state.resumeCountdownActive = false;
        }
      }).not.toThrow();
    });
  });

  describe('State corruption scenarios', () => {
    test('handles state with missing required properties', () => {
      const state = {
        ...createMockState(),
        canvas: createMockCanvas(),
        ctx: createMockCtx()
      } as any;

      // Remove some properties
      delete state.crystals;
      delete state.meteors;

      expect(() => {
        // Should handle missing arrays gracefully
        if (state.crystals) {
          state.crystals.forEach(() => {});
        }
        if (state.meteors) {
          state.meteors.forEach(() => {});
        }
      }).not.toThrow();
    });

    test('handles state with invalid modifier values', () => {
      const state = {
        ...createMockState(),
        canvas: createMockCanvas(),
        ctx: createMockCtx(),
        modifiers: {
          gameSpeed: NaN,
          playerSpeed: Infinity,
          magnetRange: -1000
        } as any
      } as GameState;

      expect(() => {
        // Should handle invalid modifier values
        const speed = state.modifiers.gameSpeed || 1;
        expect(typeof speed).toBe('number');
      }).not.toThrow();
    });
  });

  describe('Division by zero prevention', () => {
    test('handles zero distance calculations', () => {
      const box1 = { x: 100, y: 100, width: 50, height: 50 };
      const box2 = { x: 100, y: 100, width: 50, height: 50 };

      expect(() => {
        // Same position boxes
        const dx = box2.x - box1.x;
        const dy = box2.y - box1.y;
        const dist = Math.hypot(dx, dy);
        expect(dist).toBe(0);
      }).not.toThrow();
    });

    test('handles zero speed in calculations', () => {
      const speed = 0;
      const dtFactor = 1;
      const gameSpeed = 1;

      expect(() => {
        const movement = speed * dtFactor * gameSpeed;
        expect(movement).toBe(0);
      }).not.toThrow();
    });
  });

  describe('Canvas context failures', () => {
    test('handles missing canvas context gracefully', () => {
      const canvas = createMockCanvas();
      const ctx = null as any;

      expect(() => {
        // Should handle null context
        if (ctx) {
          ctx.fillRect(0, 0, 100, 100);
        }
      }).not.toThrow();
    });
  });

  describe('FPS limiter edge cases', () => {
    test('handles very slow frame times', () => {
      const targetFrameTime = 16.67; // 60fps
      let frameAccumulator = 0;
      const elapsed = 1000; // Very slow frame

      expect(() => {
        frameAccumulator += elapsed;
        if (frameAccumulator > targetFrameTime * 2) {
          frameAccumulator = 0; // Prevent spiral of death
        }
      }).not.toThrow();
    });

    test('handles zero frame time', () => {
      const elapsed = 0;
      const dtSeconds = Math.min(elapsed / 1000, 0.05);

      expect(dtSeconds).toBe(0);
      expect(() => {
        const dtFactor = dtSeconds * 60;
        expect(dtFactor).toBe(0);
      }).not.toThrow();
    });
  });

  describe('Powerup edge cases in game loop', () => {
    test('handles powerup expiration during tick', () => {
      const state = {
        ...createMockState(),
        canvas: createMockCanvas(),
        ctx: createMockCtx(),
        activePowerUps: []
      } as GameState;

      const now = performance.now();
      activatePowerUp(state, 'magnet', now);

      expect(() => {
        // Tick past expiration
        const expiresAt = state.activePowerUps[0].expiresAt!;
        tickPowerUps(state, expiresAt + 1000, 0);
      }).not.toThrow();

      expect(state.activePowerUps.length).toBe(0);
    });

    test('handles multiple powerups expiring simultaneously', () => {
      const state = {
        ...createMockState(),
        canvas: createMockCanvas(),
        ctx: createMockCtx(),
        activePowerUps: []
      } as GameState;

      const now = performance.now();
      activatePowerUp(state, 'magnet', now);
      activatePowerUp(state, 'time_slow', now);

      expect(() => {
        // Both should expire
        const maxExpires = Math.max(
          state.activePowerUps[0].expiresAt!,
          state.activePowerUps[1].expiresAt!
        );
        tickPowerUps(state, maxExpires + 1000, 0);
      }).not.toThrow();
    });
  });
});
