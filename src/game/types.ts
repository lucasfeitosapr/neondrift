import { Pool } from './pool';

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  trail: { x: number; y: number }[];
}

export interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  decay: number;
  size: number;
  color?: string | null;
  colorType?: string;
  hueOffset?: number;
}

export interface Crystal {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  rotation: number;
  glow: number;
  type: any;
  hueOffset?: number;
}

export interface Meteor {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  rotation: number;
  pulse: number;
}

export interface GameState {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  score: number;
  highScore: number;
  gameRunning: boolean;
  gameSpeed: number;
  time: number;
  dtFactor: number;
  player: Player | null;
  crystals: Crystal[];
  meteors: Meteor[];
  gridLines: any[];
  particles: Particle[];
  MAX_PARTICLES: number;
  particlePool: Pool<any>;
  lastCollectTimestamp: number;
  comboCount: number;
  floatingTexts: any[];
  fps: number;
}
