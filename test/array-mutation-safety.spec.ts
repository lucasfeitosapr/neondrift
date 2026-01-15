import { describe, test, expect } from 'vitest';
import { createMockState, createMockCanvas, createMockCtx, createCrystal, createMeteor, createPickup } from './utils';
import { GameState } from '../src/game/types';
import { checkCollision, checkPlayerCollision } from '../src/game/collision';

describe('Array Mutation Safety', () => {
  describe('Reverse iteration with splice', () => {
    test('removes items safely during reverse iteration (crystals)', () => {
      const state = {
        ...createMockState(),
        canvas: createMockCanvas(),
        ctx: createMockCtx(),
        crystals: [
          createCrystal(100, 100),
          createCrystal(200, 200),
          createCrystal(300, 300),
          createCrystal(400, 400)
        ],
        player: { x: 95, y: 95, width: 50, height: 30, speed: 4, trail: [] }
      } as GameState;

      // Simulate game loop iteration removing colliding crystals
      const removed: number[] = [];
      for (let i = state.crystals.length - 1; i >= 0; i--) {
        const crystal = state.crystals[i];
        if (checkCollision(state.player!, crystal)) {
          removed.push(i);
          state.crystals.splice(i, 1);
        }
      }

      // Should not crash, should remove colliding crystals
      expect(state.crystals.length).toBeLessThan(4);
      expect(() => {
        // Access remaining crystals - should not crash
        state.crystals.forEach(c => expect(c).toBeDefined());
      }).not.toThrow();
    });

    test('removes items safely during reverse iteration (meteors)', () => {
      const state = {
        ...createMockState(),
        canvas: createMockCanvas(),
        ctx: createMockCtx(),
        meteors: [
          createMeteor(100, 100),
          createMeteor(200, 200),
          createMeteor(300, 300)
        ],
        player: { x: 95, y: 95, width: 50, height: 30, speed: 4, trail: [] }
      } as GameState;

      // Simulate removing meteors that fall off screen
      for (let i = state.meteors.length - 1; i >= 0; i--) {
        if (state.meteors[i].y > 500) {
          state.meteors.splice(i, 1);
        }
      }

      expect(() => {
        state.meteors.forEach(m => expect(m).toBeDefined());
      }).not.toThrow();
    });

    test('removes items safely during reverse iteration (pickups)', () => {
      const state = {
        ...createMockState(),
        canvas: createMockCanvas(),
        ctx: createMockCtx(),
        powerUpPickups: [
          createPickup('magnet', 100, 100),
          createPickup('time_slow', 200, 200),
          createPickup('chain_lightning', 300, 300)
        ],
        player: { x: 95, y: 95, width: 50, height: 30, speed: 4, trail: [] }
      } as GameState;

      // Simulate removing collected pickups
      for (let i = state.powerUpPickups.length - 1; i >= 0; i--) {
        const pickup = state.powerUpPickups[i];
        if (pickup.x < state.player!.x + state.player!.width &&
            pickup.x + pickup.width > state.player!.x &&
            pickup.y < state.player!.y + state.player!.height &&
            pickup.y + pickup.height > state.player!.y) {
          state.powerUpPickups.splice(i, 1);
        }
      }

      expect(() => {
        state.powerUpPickups.forEach(p => expect(p).toBeDefined());
      }).not.toThrow();
    });

    test('handles multiple removals in same frame', () => {
      const state = {
        ...createMockState(),
        canvas: createMockCanvas(),
        ctx: createMockCtx(),
        crystals: [
          createCrystal(100, 100),
          createCrystal(105, 105),
          createCrystal(110, 110),
          createCrystal(200, 200)
        ],
        player: { x: 95, y: 95, width: 50, height: 30, speed: 4, trail: [] }
      } as GameState;

      // Remove multiple colliding crystals
      for (let i = state.crystals.length - 1; i >= 0; i--) {
        if (checkCollision(state.player!, state.crystals[i])) {
          state.crystals.splice(i, 1);
        }
      }

      // Should handle multiple removals correctly
      expect(state.crystals.length).toBeLessThanOrEqual(1);
      expect(() => {
        state.crystals.forEach(c => expect(c).toBeDefined());
      }).not.toThrow();
    });
  });

  describe('Empty array handling', () => {
    test('handles iteration when array is empty', () => {
      const state = {
        ...createMockState(),
        canvas: createMockCanvas(),
        ctx: createMockCtx(),
        crystals: [],
        meteors: [],
        powerUpPickups: []
      } as GameState;

      expect(() => {
        for (let i = state.crystals.length - 1; i >= 0; i--) {
          state.crystals.splice(i, 1);
        }
        for (let i = state.meteors.length - 1; i >= 0; i--) {
          state.meteors.splice(i, 1);
        }
        for (let i = state.powerUpPickups.length - 1; i >= 0; i--) {
          state.powerUpPickups.splice(i, 1);
        }
      }).not.toThrow();
    });
  });

  describe('Array access after mutation', () => {
    test('does not access removed items', () => {
      const state = {
        ...createMockState(),
        canvas: createMockCanvas(),
        ctx: createMockCtx(),
        crystals: [
          createCrystal(100, 100),
          createCrystal(200, 200)
        ]
      } as GameState;

      // Remove first item
      state.crystals.splice(0, 1);

      // Access remaining item - should not crash
      expect(() => {
        expect(state.crystals[0]).toBeDefined();
        expect(state.crystals[1]).toBeUndefined();
      }).not.toThrow();
    });

    test('handles array length changes during iteration', () => {
      const state = {
        ...createMockState(),
        canvas: createMockCanvas(),
        ctx: createMockCtx(),
        crystals: [
          createCrystal(100, 100),
          createCrystal(200, 200),
          createCrystal(300, 300)
        ]
      } as GameState;

      const originalLength = state.crystals.length;
      
      // Remove items during iteration
      for (let i = state.crystals.length - 1; i >= 0; i--) {
        if (i % 2 === 0) {
          state.crystals.splice(i, 1);
        }
      }

      expect(state.crystals.length).toBeLessThan(originalLength);
      expect(() => {
        state.crystals.forEach(c => expect(c).toBeDefined());
      }).not.toThrow();
    });
  });

  describe('Concurrent modifications', () => {
    test('handles removing all items', () => {
      const state = {
        ...createMockState(),
        canvas: createMockCanvas(),
        ctx: createMockCtx(),
        crystals: [
          createCrystal(100, 100),
          createCrystal(200, 200),
          createCrystal(300, 300)
        ]
      } as GameState;

      // Remove all items
      for (let i = state.crystals.length - 1; i >= 0; i--) {
        state.crystals.splice(i, 1);
      }

      expect(state.crystals.length).toBe(0);
      expect(() => {
        state.crystals.forEach(() => {});
      }).not.toThrow();
    });

    test('handles removing from middle of array', () => {
      const state = {
        ...createMockState(),
        canvas: createMockCanvas(),
        ctx: createMockCtx(),
        crystals: [
          createCrystal(100, 100),
          createCrystal(200, 200),
          createCrystal(300, 300),
          createCrystal(400, 400)
        ]
      } as GameState;

      // Remove middle items
      state.crystals.splice(1, 2);

      expect(state.crystals.length).toBe(2);
      expect(state.crystals[0]).toBeDefined();
      expect(state.crystals[1]).toBeDefined();
      expect(() => {
        state.crystals.forEach(c => expect(c).toBeDefined());
      }).not.toThrow();
    });
  });

  describe('Edge cases', () => {
    test('handles single item removal', () => {
      const state = {
        ...createMockState(),
        canvas: createMockCanvas(),
        ctx: createMockCtx(),
        crystals: [createCrystal(100, 100)]
      } as GameState;

      for (let i = state.crystals.length - 1; i >= 0; i--) {
        state.crystals.splice(i, 1);
      }

      expect(state.crystals.length).toBe(0);
    });

    test('handles negative index access prevention', () => {
      const state = {
        ...createMockState(),
        canvas: createMockCanvas(),
        ctx: createMockCtx(),
        crystals: [createCrystal(100, 100)]
      } as GameState;

      // Should not access negative indices
      expect(() => {
        for (let i = state.crystals.length - 1; i >= 0; i--) {
          if (i >= 0 && i < state.crystals.length) {
            expect(state.crystals[i]).toBeDefined();
          }
        }
      }).not.toThrow();
    });

    test('handles array with null/undefined items gracefully', () => {
      const state = {
        ...createMockState(),
        canvas: createMockCanvas(),
        ctx: createMockCtx(),
        crystals: [
          createCrystal(100, 100),
          null as any,
          createCrystal(200, 200)
        ]
      } as GameState;

      // Should handle null items without crashing
      expect(() => {
        for (let i = state.crystals.length - 1; i >= 0; i--) {
          if (state.crystals[i]) {
            expect(state.crystals[i]).toBeDefined();
          }
        }
      }).not.toThrow();
    });
  });
});
