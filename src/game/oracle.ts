import { seedRng, random } from './rng';
import { config } from './config';
import { RunSeedPayload } from './types';

export interface OracleReading {
  crystalScore: number;       // 0–10 normalised density
  meteorScore: number;        // 0–10 normalised pressure
  crystalLabel: 'SPARSE' | 'NORMAL' | 'DENSE';
  meteorLabel: 'CALM' | 'MODERATE' | 'INTENSE';
  firstMagnetAt: number | null;        // seconds
  firstLightningAt: number | null;
  firstTimeSlowAt: number | null;
  leftBias: number;            // 0–1  (<0.45 = left, >0.55 = right, else balanced)
  dangerPeakAt: number | null; // start of the busiest 5-second meteor window (seconds)
}

const SIM_SECONDS = 45;
const SIM_FPS = 60;
const SIM_FRAMES = SIM_SECONDS * SIM_FPS;
const FRAME_MS = 1000 / SIM_FPS;
const BUCKET_FRAMES = 5 * SIM_FPS; // 5-second buckets for danger detection

export function analyzeRunSeed(payload: RunSeedPayload): OracleReading {
  seedRng(payload.seed);

  let crystalCount = 0;
  let meteorCount = 0;
  let xSum = 0;
  let xCount = 0;
  let firstMagnetAt: number | null = null;
  let firstLightningAt: number | null = null;
  let firstTimeSlowAt: number | null = null;
  const meteorBuckets = new Array(Math.ceil(SIM_FRAMES / BUCKET_FRAMES)).fill(0);

  // Mirror the exact cooldown logic from game.ts update().
  // lastSpawnMs starts negative so the cooldown is already expired at t=0
  // (matches real game where performance.now() >> spawnCooldownMs at run start).
  let lastCatSpawnMs = -config.cat.spawnCooldownMs;
  let lastMagnetSpawnMs = -config.spawning.MAGNET_SPAWN_COOLDOWN_MS;

  const dtFactor = 1.0;
  const speedBonus = 1.0; // no speed scaling at game start
  const lw = config.CANVAS_WIDTH;

  for (let frame = 0; frame < SIM_FRAMES; frame++) {
    const simNow = frame * FRAME_MS;
    const t = frame / SIM_FPS;

    // ── Cat spawn ─────────────────────────────────────────────────
    const catCooldownPassed = (simNow - lastCatSpawnMs) >= config.cat.spawnCooldownMs;
    if (catCooldownPassed) {
      const catChance = config.cat.spawnChance * dtFactor;
      if (random() < catChance) {
        // consume createCatEntity calls: x, speed, hue, wobble, pattern
        random(); random(); random(); random(); random();
        lastCatSpawnMs = simNow;
      }
    }

    // ── Crystal spawn ─────────────────────────────────────────────
    const crystalChance = config.SPAWN_CRYSTAL_RATE * dtFactor * speedBonus;
    if (random() < crystalChance) {
      // createCrystalEntity: type selection (pool size 1 at score 0), x, speed, glow, hueOffset
      random(); // type
      const x = random() * (lw - config.crystal.size);
      random(); // speed
      random(); // glow
      random(); // hueOffset
      xSum += x / lw;
      xCount++;
      crystalCount++;
    }

    // ── Meteor spawn ──────────────────────────────────────────────
    const meteorChance = config.SPAWN_METEOR_RATE * dtFactor * speedBonus;
    if (random() < meteorChance) {
      random(); // x
      random(); // speed
      meteorCount++;
      meteorBuckets[Math.floor(frame / BUCKET_FRAMES)]++;
    }

    // ── Magnet spawn ──────────────────────────────────────────────
    const magnetChance = config.SPAWN_MAGNET_RATE * dtFactor;
    if (random() < magnetChance) {
      const magnetCooldownPassed = (simNow - lastMagnetSpawnMs) >= config.spawning.MAGNET_SPAWN_COOLDOWN_MS;
      if (magnetCooldownPassed) {
        random(); // x position
        random(); // style
        if (firstMagnetAt === null) firstMagnetAt = t;
        lastMagnetSpawnMs = simNow;
      }
    }

    // ── Chain lightning spawn ─────────────────────────────────────
    const lightningChance = config.SPAWN_CHAIN_LIGHTNING_RATE * dtFactor;
    if (random() < lightningChance) {
      random(); // x position
      if (firstLightningAt === null) firstLightningAt = t;
    }

    // ── Time slow spawn ───────────────────────────────────────────
    const timeSlowChance = config.SPAWN_TIME_SLOW_RATE * dtFactor;
    if (random() < timeSlowChance) {
      random(); // x position
      random(); // style
      if (firstTimeSlowAt === null) firstTimeSlowAt = t;
    }
  }

  // Reset so the actual run starts from the same seed state
  seedRng(payload.seed);

  // ── Normalise scores ──────────────────────────────────────────
  const expectedCrystals = config.SPAWN_CRYSTAL_RATE * SIM_FRAMES;
  const expectedMeteors  = config.SPAWN_METEOR_RATE  * SIM_FRAMES;
  const crystalRatio = crystalCount / expectedCrystals;
  const meteorRatio  = meteorCount  / expectedMeteors;

  // Map ratio to 0–10 bar score (0.8–1.2 range → 3–7)
  const toScore = (ratio: number) => Math.round(Math.min(10, Math.max(0, (ratio - 0.5) * 10 + 3)));
  const crystalScore = toScore(crystalRatio);
  const meteorScore  = toScore(meteorRatio);

  const crystalLabel = crystalRatio < 0.88 ? 'SPARSE' : crystalRatio > 1.12 ? 'DENSE' : 'NORMAL';
  const meteorLabel  = meteorRatio  < 0.88 ? 'CALM'   : meteorRatio  > 1.12 ? 'INTENSE' : 'MODERATE';

  // Bias: 0 = full left, 0.5 = balanced, 1 = full right
  const leftBias = xCount > 0 ? xSum / xCount : 0.5;

  // Danger: bucket with highest meteor density vs average
  const avgPerBucket = expectedMeteors / meteorBuckets.length;
  const maxBucket = Math.max(...meteorBuckets);
  const peakIdx = meteorBuckets.indexOf(maxBucket);
  const dangerPeakAt = maxBucket > avgPerBucket * 1.4 ? peakIdx * 5 : null;

  return {
    crystalScore, meteorScore,
    crystalLabel, meteorLabel,
    firstMagnetAt, firstLightningAt, firstTimeSlowAt,
    leftBias, dangerPeakAt
  };
}
