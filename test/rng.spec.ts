import { describe, test, expect, vi, afterEach } from 'vitest';
import { seedRng, random, getCurrentSeed } from '../src/game/rng';

describe('rng — determinism', () => {
  test('same seed produces identical sequence', () => {
    seedRng(0xDEADBEEF);
    const seq1 = Array.from({ length: 10 }, () => random());
    seedRng(0xDEADBEEF);
    const seq2 = Array.from({ length: 10 }, () => random());
    expect(seq1).toEqual(seq2);
  });

  test('different seeds produce different sequences', () => {
    seedRng(12345);
    const seqA = Array.from({ length: 5 }, () => random());
    seedRng(99999);
    const seqB = Array.from({ length: 5 }, () => random());
    expect(seqA).not.toEqual(seqB);
  });

  test('random() always returns value in [0, 1)', () => {
    seedRng(42);
    for (let i = 0; i < 1000; i++) {
      const v = random();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  test('seed zero produces valid output', () => {
    seedRng(0);
    const v = random();
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThan(1);
  });

  test('getCurrentSeed reflects seedRng call', () => {
    seedRng(0xCAFEBABE);
    // seed advances on each random() call — just check it's non-zero after seeding
    expect(getCurrentSeed()).not.toBe(0);
  });
});

describe('quantum — fetchQuantumSeed', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('fallback path returns valid payload when fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));
    // Dynamic import ensures the stub is in place before the module runs
    const { fetchQuantumSeed } = await import('../src/game/quantum');
    const payload = await fetchQuantumSeed();

    expect(payload.source).toBe('local');
    expect(payload.seed).toBeGreaterThanOrEqual(0);
    expect(payload.hex).toHaveLength(8); // uint32 as 8 hex chars
    expect(payload.measuredAt).toBeGreaterThan(0);
  });

  test('fallback seed drives a valid random() sequence', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const { fetchQuantumSeed } = await import('../src/game/quantum');
    const payload = await fetchQuantumSeed();

    seedRng(payload.seed);
    const values = Array.from({ length: 5 }, () => random());
    expect(values.every(v => v >= 0 && v < 1)).toBe(true);
  });

  test('same seed from two fallback calls drives identical runs', () => {
    const fakeSeed = 0xABCDEF01;
    seedRng(fakeSeed);
    const run1 = Array.from({ length: 20 }, () => random());
    seedRng(fakeSeed);
    const run2 = Array.from({ length: 20 }, () => random());
    expect(run1).toEqual(run2);
  });
});
