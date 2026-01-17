import { config } from './config';
import { CatDrop, Crystal, CrystalType, Meteor } from './types';

export function createCrystalEntity(logicalWidth: number, gameSpeed: number, score: number): Crystal {
  const typesPool: CrystalType[] = [];
  const thresholds = config.crystal.thresholds;
  const weights = config.crystal.spawnWeights;
  
  // Cyan crystals - base crystal type (always available if enabled)
  if (config.features.ENABLE_CRYSTAL_CYAN) {
    for (let i = 0; i < weights.cyan; i++) {
      typesPool.push({ color: 'cyan', points: 10, colorHex: '#00ffff', colorRgb: '0, 255, 255' });
    }
  }

  // Higher tier crystals unlock at score thresholds (if feature flags allow)
  if (config.features.ENABLE_CRYSTAL_PURPLE && score >= thresholds.purple) {
    for (let i = 0; i < weights.purple; i++) {
      typesPool.push({ color: 'purple', points: 20, colorHex: '#aa00ff', colorRgb: '170, 0, 255' });
    }
  }
  if (config.features.ENABLE_CRYSTAL_GOLD && score >= thresholds.gold) {
    for (let i = 0; i < weights.gold; i++) {
      typesPool.push({ color: 'gold', points: 30, colorHex: '#ffaa00', colorRgb: '255, 170, 0' });
    }
  }
  if (config.features.ENABLE_CRYSTAL_RAINBOW && score >= thresholds.rainbow) {
    for (let i = 0; i < weights.rainbow; i++) {
      typesPool.push({ color: 'rainbow', points: 50, colorHex: null, colorRgb: '255, 255, 255' });
    }
  }

  // Fallback: if all crystals are disabled, use cyan as default
  if (typesPool.length === 0) {
    typesPool.push({ color: 'cyan', points: 10, colorHex: '#00ffff', colorRgb: '0, 255, 255' });
  }

  const chosenType = typesPool[Math.floor(Math.random() * typesPool.length)];

  return {
    x: Math.random() * (logicalWidth - config.crystal.size),
    y: -config.crystal.size,
    width: config.crystal.size,
    height: config.crystal.size,
    speed: gameSpeed + Math.random() * 2,
    rotation: 0,
    glow: Math.random() * 0.5 + 0.5,
    type: chosenType,
    hueOffset: Math.random() * 360
  };
}

export function createMeteorEntity(logicalWidth: number, gameSpeed: number): Meteor {
  return {
    x: Math.random() * (logicalWidth - config.meteor.size),
    y: -config.meteor.size,
    width: config.meteor.size,
    height: config.meteor.size,
    speed: gameSpeed + Math.random() * 3,
    rotation: 0,
    pulse: 0
  };
}

export function createCatEntity(logicalWidth: number, gameSpeed: number): CatDrop {
  const size = config.cat.size;
  const patterns: CatDrop['pattern'][] = ['tabby', 'neon', 'shadow'];
  return {
    x: Math.random() * (logicalWidth - size),
    y: -size,
    width: size,
    height: size,
    speed: gameSpeed + config.cat.speedMinBonus + Math.random() * (config.cat.speedMaxBonus - config.cat.speedMinBonus),
    hue: Math.random() * 360,
    wobble: Math.random() * Math.PI * 2,
    pattern: patterns[Math.floor(Math.random() * patterns.length)]
  };
}

export function createCrystal(x: number, y: number, speed: number, type: CrystalType): Crystal {
  return {
    x,
    y,
    width: config.crystal.size,
    height: config.crystal.size,
    speed,
    rotation: 0,
    glow: Math.random() * 0.5 + 0.5,
    type,
    hueOffset: Math.random() * 360
  };
}

export function getRainbowCrystalType(): CrystalType | null {
  if (!config.features.ENABLE_CRYSTAL_RAINBOW) return null;
  return {
    color: 'rainbow',
    points: 50,
    colorHex: null,
    colorRgb: '255, 255, 255'
  };
}
