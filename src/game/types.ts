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

export interface CatDrop {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  hue: number;
  wobble: number;
  pattern: 'tabby' | 'neon' | 'shadow';
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
  data?: Record<string, unknown>;
}

export type MagnetStyle = 'horseshoe' | 'vortex' | 'ring' | 'field';
export type TimeSlowStyle = 'clock' | 'hourglass';

export interface PowerUpPickup {
  id: PowerUpId;
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  style?: MagnetStyle; // Visual style for magnet
  timeSlowStyle?: TimeSlowStyle; // Visual style for time_slow
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
  invincibility: boolean;
  meteors: boolean;
  forceMaxDifficulty: boolean;
}

// ═══════════════════════════════════════════════════════════════
// TIME SLOW VISUAL EFFECTS
// ═══════════════════════════════════════════════════════════════
export interface TimeSlowRipple {
  x: number;
  y: number;
  startTime: number;
  maxRadius: number;
  durationMs: number;
}

// ═══════════════════════════════════════════════════════════════
// REVENGE METEOR - Delayed targeted meteor
// ═══════════════════════════════════════════════════════════════
export interface PendingRevengeMeteor {
  spawnAt: number;        // Timestamp when meteor should spawn
  targetX: number;        // Player X position at time of trigger (center)
  targetY: number;        // Player Y position at time of trigger (center)
  speed: number;          // Pre-calculated speed for this meteor
  warningShown: boolean;  // Has the warning flash been shown?
}

// Viewport information for rendering
export interface Viewport {
  width: number;
  height: number;
  dpr: number;
}

export interface TouchAnchor {
  playerX: number;
  playerY: number;
  startX: number;
  startY: number;
}

export interface GameState {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  score: number;
  highScore: number;
  gameRunning: boolean;
  paused: boolean;
  resumeCountdownActive: boolean;
  resumeCountdownTarget: number | null;
  resumeCountdownValue?: number;
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
  timeSlowRipples: TimeSlowRipple[];
  pendingRevengeMeteors: PendingRevengeMeteor[];
  _restartRequested?: boolean;
  _touchAnchor?: TouchAnchor | null;
  viewport?: Viewport;
  cats: CatDrop[];
  lastCatSpawnTimestamp: number;
}
