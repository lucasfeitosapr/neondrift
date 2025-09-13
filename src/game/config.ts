export const config = {
  // Canvas
  CANVAS_WIDTH: 400,
  CANVAS_HEIGHT: 500,

  // Gameplay
  INITIAL_GAME_SPEED: 2,
  SPAWN_CRYSTAL_RATE: 0.025, // per-frame baseline (will be scaled by dtFactor)
  SPAWN_METEOR_RATE: 0.012,

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
  FPS_SMOOTHING: 0.9
};
