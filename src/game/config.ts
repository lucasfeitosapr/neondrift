export const config = {
  // Canvas
  CANVAS_WIDTH: 400,
  CANVAS_HEIGHT: 500,

  // Gameplay
  INITIAL_GAME_SPEED: 2,
  SPAWN_CRYSTAL_RATE: 0.045, // CHAOS MODE! More crystals = more chain lightning fun!
  SPAWN_METEOR_RATE: 0.014,  // Slightly more meteors to balance
  SPAWN_MAGNET_RATE: 0.012, // independent magnet spawn rate (boosted for stacking)
  SPAWN_CHAIN_LIGHTNING_RATE: 0.008, // Slightly more common to let players experience the chaos!
  MAGNET_PULL_STRENGTH: 4.8, // magnet pull multiplier (scaled by dtFactor)

  // Particles & pools
  PARTICLE_POOL_SIZE: 400,

  // Combo engine
  COMBO_TIMEOUT: 800, // ms
  MAX_COMBO: 6,

  // Entity sizes and thresholds
  crystal: {
    size: 25,
    // score thresholds (for appearance)
    thresholds: {
      purple: 150,
      gold: 350,
      rainbow: 500
    }
  },

  meteor: {
    size: 30
  },

  // Misc
  FPS_SMOOTHING: 0.9,

  // ═══════════════════════════════════════════════════════════════
  // FEATURE FLAGS - Toggle experimental behaviors
  // ═══════════════════════════════════════════════════════════════
  features: {
    // When true: collecting magnets EXTENDS duration (3 magnets = 18s total)
    // When false: collecting magnets RESETS the timer (always 6s from last pickup)
    MAGNET_STACKS_DURATION: false,
    
    // When true: magnet spawn rate decreases based on active stacks
    // (harder to get more magnets when you already have the power-up)
    MAGNET_DIMINISHING_SPAWNS: true,
    
    // Spawn rate multiplier per active magnet stack (0.4 = 40% of base rate per stack)
    MAGNET_SPAWN_REDUCTION_PER_STACK: 0.4
  },

  // ═══════════════════════════════════════════════════════════════
  // SPAWN PROTECTION - Prevent overlap and clutter
  // ═══════════════════════════════════════════════════════════════
  spawning: {
    // Max power-up pickups on screen at once (prevents overfeeding)
    MAX_POWERUP_PICKUPS: 3,
    
    // Minimum horizontal distance between pickups (prevents stacking)
    MIN_PICKUP_DISTANCE_X: 60,
    
    // Vertical buffer - don't check distance for pickups far apart vertically
    PICKUP_DISTANCE_CHECK_Y: 100,
    
    // Cooldown between magnet spawns in milliseconds (prevents pair spawning)
    MAGNET_SPAWN_COOLDOWN_MS: 1500 // 1.5s - balanced for stacking
  },

  // ═══════════════════════════════════════════════════════════════
  // MAGNET VISUAL STYLE - Choose your aesthetic!
  // ═══════════════════════════════════════════════════════════════
  // Options: 'horseshoe' | 'vortex' | 'ring' | 'field' | 'random'
  MAGNET_STYLE: 'random' as 'horseshoe' | 'vortex' | 'ring' | 'field' | 'random',

  // ═══════════════════════════════════════════════════════════════
  // PLAYER MOVEMENT
  // ═══════════════════════════════════════════════════════════════
  // Enable vertical movement (up/down) in addition to horizontal
  ENABLE_VERTICAL_MOVEMENT: true,
  
  // Vertical movement bounds (padding from top/bottom edges)
  PLAYER_VERTICAL_PADDING: 40
};
