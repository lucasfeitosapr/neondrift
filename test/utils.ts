import { GameState, Player, PowerUpPickup, Crystal, Meteor, PowerUpId, CatDrop } from '../src/game/types';
import { Pool } from '../src/game/pool';
import { defaultModifiers } from '../src/game/state';

export function createMockCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 360;
  canvas.height = 640;
  return canvas;
}

export function createMockCtx(): CanvasRenderingContext2D {
  return createMockCanvas().getContext('2d') as CanvasRenderingContext2D;
}

export function createMockState(): Partial<GameState> {
  const canvas = createMockCanvas();
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  
  return {
    canvas,
    ctx,
    score: 0,
    highScore: 0,
    gameRunning: true,
    paused: false,
    resumeCountdownActive: false,
    resumeCountdownTarget: null,
    gameSpeed: 2,
    time: 0,
    dtFactor: 1,
    player: createMockPlayer(),
    crystals: [],
    meteors: [],
    cats: [],
    gridLines: [],
    particles: [],
    MAX_PARTICLES: 400,
    particlePool: new Pool(() => ({
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
    }), 400),
    lastCollectTimestamp: 0,
    lastMagnetSpawnTimestamp: 0,
    comboCount: 0,
    floatingTexts: [],
    fps: 60,
    debug: { grid: false, boxes: false, particles: false, invincibility: false, meteors: true, forceMaxDifficulty: false },
    debugEnabled: false,
    viewport: { width: 360, height: 640, dpr: 1 },
    modifiers: { ...defaultModifiers },
    activePowerUps: [],
    powerUpPickups: [],
    chainLightningArcs: [],
    timeSlowRipples: [],
    pendingRevengeMeteors: [],
    lastCatSpawnTimestamp: 0
  };
}

export function createMockPlayer(): Player {
  return {
    x: 155,
    y: 570,
    width: 50,
    height: 30,
    speed: 4,
    trail: []
  };
}

export function createPickup(id: PowerUpId, x: number, y: number, speed = 3): PowerUpPickup {
  return {
    id,
    x,
    y,
    width: 22,
    height: 22,
    speed
  };
}

export function createCrystal(x: number, y: number, color: 'cyan' | 'purple' | 'gold' | 'rainbow' = 'cyan'): Crystal {
  const typeMap = {
    cyan: { color: 'cyan' as const, points: 10, colorHex: '#00ffff', colorRgb: '0, 255, 255' },
    purple: { color: 'purple' as const, points: 20, colorHex: '#aa00ff', colorRgb: '170, 0, 255' },
    gold: { color: 'gold' as const, points: 30, colorHex: '#ffaa00', colorRgb: '255, 170, 0' },
    rainbow: { color: 'rainbow' as const, points: 50, colorHex: null, colorRgb: '255, 255, 255' }
  };
  
  return {
    x,
    y,
    width: 20,
    height: 20,
    speed: 3,
    rotation: 0,
    glow: 0.7,
    type: typeMap[color],
    hueOffset: 0
  };
}

export function createMeteor(x: number, y: number, speed = 3): Meteor {
  return {
    x,
    y,
    width: 30,
    height: 30,
    speed,
    rotation: 0,
    pulse: 0
  };
}

export function createCat(x: number, y: number, speed = 3): CatDrop {
  return {
    x,
    y,
    width: 24,
    height: 24,
    speed,
    hue: 0,
    wobble: 0,
    pattern: 'tabby'
  };
}
