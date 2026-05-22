let _seed = 0;

export function seedRng(s: number): void {
  _seed = s >>> 0;
}

export function getCurrentSeed(): number {
  return _seed;
}

// mulberry32 — fast, good statistical quality
export function random(): number {
  _seed += 0x6D2B79F5;
  let t = Math.imul(_seed ^ (_seed >>> 15), 1 | _seed);
  t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
  return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
}
