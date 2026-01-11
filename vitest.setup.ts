// Basic setup for vitest (jsdom environment)
// No-op for now; could initialize globals or mocks here.
// Vitest setup: provide minimal mocks for headless tests (WebSocket, canvas 2D context, rAF)

const noop = () => {};

class MockWebSocket {
  url: string;
  readyState: number = 1;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: ((e: any) => void) | null = null;
  constructor(url: string) { this.url = url; /* emulate open */ setTimeout(() => { this.onopen && this.onopen(); }, 0); }
  addEventListener(type: string, cb: (...args: any[]) => void) { if (type === 'open') this.onopen = cb as any; if (type === 'close') this.onclose = cb as any; if (type === 'error') this.onerror = cb as any; }
  removeEventListener() {}
  send(_data?: any) {}
  close() { this.readyState = 3; this.onclose && this.onclose(); }
}

// Only polyfill if an environment WebSocket is not already present
if (!(globalThis as any).WebSocket) {
  (globalThis as any).WebSocket = MockWebSocket;
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
  fillRect: noop,
  fillText: noop,
  translate: noop,
  rotate: noop,
  setTransform: noop,
  measureText: (text: string) => ({ width: (text || '').length * 8 } as any),
  // properties commonly written by the game
  fillStyle: '' as any,
  strokeStyle: '' as any,
  shadowColor: '' as any,
  shadowBlur: 0 as any,
  globalAlpha: 1 as any,
  lineWidth: 1 as any,
  font: '' as any,
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
