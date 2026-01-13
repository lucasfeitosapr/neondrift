import { Pool } from './pool';

export type CrystalColor = 'cyan' | 'purple' | 'gold' | 'rainbow';

export interface CrystalType {
  color: CrystalColor;
  points: number;
  colorHex: string | null;
  colorRgb: string;
}

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  trail: { x: number; y: number }[];
}

export type ParticleColorMode = 'rgb' | 'rainbow';

export interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  decay: number;
  size: number;
  color: string | null;
  colorType: ParticleColorMode;
  hueOffset: number;
}

export interface Crystal {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  rotation: number;
  glow: number;
  type: CrystalType;
  hueOffset: number;
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

export interface GridLine {
  y: number;
  opacity: number;
}

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  life: number;
  color: string;
  vy: number;
}

export type PowerUpId = 'magnet' | 'time_slow' | 'chain_lightning';
// refresh: resets timer to full duration
// stack: increases stacks, resets timer
// extend: increases stacks, ADDS duration to remaining time
// parallel: allows multiple independent instances
export type PowerUpStackingMode = 'refresh' | 'stack' | 'extend' | 'parallel';

export interface PowerUpDefinition {
  id: PowerUpId;
  displayName: string;
  kind: 'buff' | 'instant';
  durationMs?: number;
  stacking?: PowerUpStackingMode;
  maxStacks?: number;
  applyModifiers?: (mods: Modifiers, state: GameState, instance: PowerUpInstance) => void;
  onActivate?: (state: GameState, instance: PowerUpInstance, now: number) => void;
  onTick?: (state: GameState, dtMs: number, instance: PowerUpInstance, now: number) => void;
  onExpire?: (state: GameState, instance: PowerUpInstance, now: number) => void;
}

export interface PowerUpInstance {
  id: PowerUpId;
  startedAt: number;
  expiresAt?: number;
  stacks: number;
  data?: Record<string, any>;
}

export type MagnetStyle = 'horseshoe' | 'vortex' | 'ring' | 'field';

export interface PowerUpPickup {
  id: PowerUpId;
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  style?: MagnetStyle; // Visual style for rendering
}

export interface Modifiers {
  playerSpeed: number;
  gameSpeed: number;
  spawnRateCrystal: number;
  spawnRateMeteor: number;
  spawnRateMagnet: number;
  magnetRange: number;
  magnetPullTier: number; // 1=gentle, 2=strong, 3=SUPER MAGNET
  superMagnet: boolean; // At 3 stacks: crystals rush directly at player!
  scoreMultiplier: number;
}

// ═══════════════════════════════════════════════════════════════
// CHAIN LIGHTNING - Visual arc connecting crystals
// ═══════════════════════════════════════════════════════════════
export interface ChainLightningArc {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  life: number;      // 0-1, decays over time
  color: string;     // Hex color of the chain
  segments: { x: number; y: number }[]; // Pre-computed jagged path
}

export interface DebugFlags {
  grid: boolean;
  boxes: boolean;
  particles: boolean;
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
  gridLines: GridLine[];
  particles: Particle[];
  MAX_PARTICLES: number;
  particlePool: Pool<Particle>;
  lastCollectTimestamp: number;
  lastMagnetSpawnTimestamp: number;
  comboCount: number;
  floatingTexts: FloatingText[];
  fps: number;
  debug?: DebugFlags;
  debugEnabled?: boolean;
  modifiers: Modifiers;
  activePowerUps: PowerUpInstance[];
  powerUpPickups: PowerUpPickup[];
  chainLightningArcs: ChainLightningArc[];
}
