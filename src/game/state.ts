import { config } from './config';
import { Pool } from './pool';
import { GameState, Modifiers, Particle } from './types';

export const defaultModifiers: Modifiers = {
  playerSpeed: 1,
  gameSpeed: 1,
  spawnRateCrystal: 1,
  spawnRateMeteor: 1,
  spawnRateMagnet: 1,
  magnetRange: 0,
  magnetPullTier: 0,
  superMagnet: false,
  scoreMultiplier: 1
};

export function createState(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): GameState {
  return {
    canvas,
    ctx,
    score: 0,
    highScore: parseInt(localStorage.getItem('neondrift_highscore') || '0', 10) || 0,
    gameRunning: true,
    paused: false,
    resumeCountdownActive: false,
    resumeCountdownTarget: null,
    gameSpeed: config.INITIAL_GAME_SPEED,
    time: 0,
    dtFactor: 1,
    player: null,
    crystals: [],
    meteors: [],
    cats: [],
    gridLines: [],
    particles: [],
    MAX_PARTICLES: config.PARTICLE_POOL_SIZE,
    particlePool: new Pool<Particle>(
      () => ({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        decay: 0,
        size: 1,
        color: '0,255,255',
        colorType: 'rgb',
        hueOffset: 0
      }),
      config.PARTICLE_POOL_SIZE
    ),
    lastCollectTimestamp: 0,
    lastMagnetSpawnTimestamp: 0,
    comboCount: 0,
    floatingTexts: [],
    fps: 60,
    debug: { grid: true, boxes: false, particles: false, invincibility: false, meteors: true, forceMaxDifficulty: false },
    debugEnabled: true,
    viewport: { width: canvas.width, height: canvas.height, dpr: 1 },
    modifiers: { ...defaultModifiers },
    activePowerUps: [],
    powerUpPickups: [],
    chainLightningArcs: [],
    timeSlowRipples: [],
    pendingRevengeMeteors: [],
    lastCatSpawnTimestamp: 0
  };
}
