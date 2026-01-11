import { createState } from '../src/game/state';

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
});
