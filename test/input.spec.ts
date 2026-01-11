import { createState } from '../src/game/state';
import { initInput, keys } from '../src/game/input';

describe('input', () => {
  test('keypress updates keys map and requests restart when game stopped', () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    const state = createState(canvas, ctx);
    state.gameRunning = false;
    initInput(state);

    const ev = new KeyboardEvent('keydown', { key: 'a' });
    document.dispatchEvent(ev);

    expect(keys['a']).toBe(true);
    expect((state as any)._restartRequested).toBe(true);
  });
});
