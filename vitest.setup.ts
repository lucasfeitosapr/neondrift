// Basic setup for vitest (jsdom environment)
// Vitest setup: provide minimal mocks for headless tests (canvas 2D context, rAF)

const noop = () => {};

// Mock gradient object with addColorStop method
class MockCanvasGradient {
  addColorStop(_offset: number, _color: string): void {
    // No-op for tests
  }
}

// Lightweight CanvasRenderingContext2D shim used by the game code during tests
const mockCtx: Partial<CanvasRenderingContext2D> = {
  save: noop,
  restore: noop,
  beginPath: noop,
  closePath: noop,
  moveTo: noop,
  lineTo: noop,
  stroke: noop,
  fill: noop, // Added for fill() calls
  fillRect: noop,
  clearRect: noop, // Added for renderer.ts
  fillText: noop,
  translate: noop,
  rotate: noop,
  setTransform: noop,
  arc: noop, // Added for rendering circles/arcs
  quadraticCurveTo: noop, // Added for rendering curves
  bezierCurveTo: noop, // Added for rendering curves
  createLinearGradient: () => new MockCanvasGradient() as any, // Added for gradient creation
  createRadialGradient: () => new MockCanvasGradient() as any, // Added for radial gradients
  measureText: (text: string) => ({ width: (text || '').length * 8 } as any),
  // properties commonly written by the game
  fillStyle: '' as any,
  strokeStyle: '' as any,
  shadowColor: '' as any,
  shadowBlur: 0 as any,
  globalAlpha: 1 as any,
  lineWidth: 1 as any,
  font: '' as any,
  textAlign: 'left' as any,
  textBaseline: 'alphabetic' as any,
};

// Force canvas.getContext('2d') to return the lightweight shim in headless tests
(HTMLCanvasElement.prototype as any).getContext = function(_type?: string) {
  return mockCtx as CanvasRenderingContext2D;
};

// rAF polyfill for the test environment
(globalThis as any).requestAnimationFrame = (cb: FrameRequestCallback) => {
  return setTimeout(() => cb(performance.now()), 16) as unknown as number;
};
(globalThis as any).cancelAnimationFrame = (id: number) => { clearTimeout(id); };

// Ensure devicePixelRatio exists (some jsdom environments omit it)
if (!(globalThis as any).devicePixelRatio) (globalThis as any).devicePixelRatio = 1;

export {};
