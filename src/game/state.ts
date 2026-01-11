import { config } from './config';
import { Pool } from './pool';
import { GameState } from './types';

export function createState(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): GameState {
  return {
    canvas,
    ctx,
    score: 0,
    highScore: parseInt(localStorage.getItem('neondrift_highscore') || '0', 10) || 0,
    gameRunning: true,
    gameSpeed: config.INITIAL_GAME_SPEED,
    time: 0,
    dtFactor: 1,
    player: null,
    crystals: [],
    meteors: [],
    gridLines: [],
    particles: [],
    MAX_PARTICLES: config.PARTICLE_POOL_SIZE,
    particlePool: new Pool(() => ({ active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, decay: 0, size: 1, color: '0,255,255' }), config.PARTICLE_POOL_SIZE),
    lastCollectTimestamp: 0,
    comboCount: 0,
    floatingTexts: [],
    fps: 60
  };
}
