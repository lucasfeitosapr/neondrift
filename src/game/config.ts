export const config = {
  // Canvas
  CANVAS_WIDTH: 360,
  CANVAS_HEIGHT: 640,

  // Gameplay
  INITIAL_GAME_SPEED: 2,

  // ═══════════════════════════════════════════════════════════════
  // DIFFICULTY SCALING - Controls how fast the game ramps up
  // ═══════════════════════════════════════════════════════════════
  difficulty: {
    // Points needed to increase difficulty level
    SCORE_MILESTONE: 500,
    // Speed increase per milestone (lower = gentler curve)
    SPEED_INCREMENT: 0.25,
    // Maximum game speed cap (prevents insane speeds)
    MAX_GAME_SPEED: 6
  },

  SPAWN_CRYSTAL_RATE: 0.050, // CHAOS MODE! More crystals = more chain lightning fun!
  SPAWN_METEOR_RATE: 0.016,  // Slightly more meteors to balance
  SPAWN_MAGNET_RATE: 0.014, // independent magnet spawn rate (boosted for stacking)
  SPAWN_CHAIN_LIGHTNING_RATE: 0.008, // Slightly more common to let players experience the chaos!
  SPAWN_TIME_SLOW_RATE: 0.004, // Same rarity as chain lightning
  MAGNET_PULL_STRENGTH: 4.8, // magnet pull multiplier (scaled by dtFactor)
  dynamicDifficulty: {
    combo: {
      minComboForAggro: 3,
      spawnBonusPerLevel: 0.08,
      spawnMaxMultiplier: 1.6,
      lowComboSpawnMultiplier: 0.9,
      meteorSpeedBonusPerLevel: 0.05,
      meteorSpeedMaxMultiplier: 1.35,
      lowComboSpeedMultiplier: 0.85
    }
  },

  // Particles & pools
  PARTICLE_POOL_SIZE: 400,
  
  particles: {
    // Decay rate: lower = longer lasting (lifetime ≈ 1/decay seconds at 60fps)
    DECAY_RAINBOW: 0.04,         // ~0.4s - flashy rainbow bursts
    DECAY_NORMAL: 0.03,          // ~0.55s - regular crystal particles
    DECAY_EXPLOSION: 0.02,       // ~0.8s - player death explosion
    DECAY_METEOR_ZAP: 0.025,     // ~0.65s - chain lightning destroys meteor (dramatic!)
    DECAY_CRYSTAL_CHAIN: 0.04   // ~0.4s - chain lightning collects crystal (snappy)
  },

  // Combo engine
  COMBO_TIMEOUT: 1050, // ms
  MAX_COMBO: 6,

  // Entity sizes and thresholds
  crystal: {
    size: 25,
    // score thresholds (for appearance)
    thresholds: {
      purple: 1500,
      gold: 3500,
      rainbow: 6500
    }
  },

  meteor: {
    size: 30
  },

  cat: {
    size: 26,
    basePoints: 120,
    pointsScalePerLevel: 0.08,
    spawnChance: 0.0025,
    spawnCooldownMs: 12000,
    maxOnScreen: 3,
    speedMinBonus: 1.2,
    speedMaxBonus: 2.6
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
  // MAGNET POWER-UP
  // ═══════════════════════════════════════════════════════════════
  magnet: {
    // Maximum stacks allowed
    MAX_STACKS: 2,
    
    // Stacks required for SUPER MAGNET mode (set higher than MAX_STACKS to disable)
    SUPER_MAGNET_THRESHOLD: 3,
    
    // Visual style: 'horseshoe' | 'vortex' | 'ring' | 'field' | 'random'
    STYLE: 'vortex' as 'horseshoe' | 'vortex' | 'ring' | 'field' | 'random'
  },

  // ═══════════════════════════════════════════════════════════════
  // TIME SLOW POWER-UP - Bullet time vibes!
  // ═══════════════════════════════════════════════════════════════
  timeSlow: {
    // Duration in milliseconds
    DURATION_MS: 4500,
    
    // Game speed multiplier (0.6 = 60% speed, 0.3 = 30% speed)
    SPEED_MULTIPLIER: 0.3,
    
    // Spawn rate multipliers during slow-mo (reduce spawning slightly)
    SPAWN_RATE_CRYSTAL: 0.8,
    SPAWN_RATE_METEOR: 0.8,
    
    // Visual effects on activation
    EFFECT_RIPPLE: true,     // Circular ripple wave from player
    EFFECT_SCANLINES: false,   // CRT scanlines overlay during effect
    
    // Scanline settings
    SCANLINE_OPACITY: 0.12,   // How visible the scanlines are
    SCANLINE_SPEED: 0.5,      // How fast scanlines scroll
    
    // Ripple settings
    RIPPLE_DURATION_MS: 600,  // How long the ripple expands
    RIPPLE_MAX_RADIUS: 400,   // Maximum ripple size
    
    // ═══════════════════════════════════════════════════════════════
    // REVENGE METEOR - Punishment for abusing time! 😈
    // ═══════════════════════════════════════════════════════════════
    revenge: {
      ENABLED: true,                    // Master toggle for revenge system
      
      // Chance calculation: BASE + (crystals * PER_CRYSTAL), capped at MAX
      BASE_CHANCE: 0.10,                // 10% base chance even if no crystals collected
      CHANCE_PER_CRYSTAL: 0.08,         // +8% per crystal collected during slow-mo
      MAX_CHANCE: 0.85,                 // Cap at 85% (always a chance to escape!)
      
      // Timing
      DELAY_MS: 400,                    // Delay after effect ends before meteor spawns
      
      // Meteor properties
      SPEED_MIN: 6,                     // Minimum speed (normal meteors are ~3-4)
      SPEED_MAX: 9,                     // Maximum speed (FAST!)
      
      // Warning flash before meteor (so player knows something's coming)
      WARNING_FLASH: true,              // Brief screen edge flash
      WARNING_COLOR: '#ff0044'         // Danger red
    }
  },
  
  // Options: 'clock' | 'hourglass' | 'random'
  TIME_SLOW_STYLE: 'random' as 'clock' | 'hourglass' | 'random',

  // ═══════════════════════════════════════════════════════════════
  // PLAYER MOVEMENT
  // ═══════════════════════════════════════════════════════════════
  // Player movement speed (pixels per frame at 60fps)
  PLAYER_SPEED: 4,
  
  // Enable vertical movement (up/down) in addition to horizontal
  ENABLE_VERTICAL_MOVEMENT: true,
  
  // Vertical movement bounds (padding from top/bottom edges)
  PLAYER_VERTICAL_PADDING: 40,
  
  // ═══════════════════════════════════════════════════════════════
  // PLAYER HITBOX - Shrink the collision box to match triangle shape
  // ═══════════════════════════════════════════════════════════════
  // Pixels to inset from top (removes empty corners near ship tip)
  PLAYER_HITBOX_TOP_INSET: 10,
  // Pixels to inset from each side (optional, for tighter hitbox)
  PLAYER_HITBOX_SIDE_INSET: 5,

  // ═══════════════════════════════════════════════════════════════
  // PERFORMANCE
  // ═══════════════════════════════════════════════════════════════
  TARGET_FPS: 60           // 0 = unlimited (uses monitor refresh rate)
};
