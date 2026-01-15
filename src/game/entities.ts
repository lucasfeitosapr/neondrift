import { config } from './config';
import { CatDrop, Crystal, CrystalType, Meteor } from './types';

export function createCrystalEntity(logicalWidth: number, gameSpeed: number, score: number): Crystal {
  const typesPool: CrystalType[] = [];
  const thresholds = config.crystal.thresholds;
  
  // Cyan crystals always available
  typesPool.push({ color: 'cyan', points: 10, colorHex: '#00ffff', colorRgb: '0, 255, 255' });

  // Higher tier crystals unlock at score thresholds
  if (score >= thresholds.purple) {
    for (let i = 0; i < 4; i++) typesPool.push({ color: 'purple', points: 20, colorHex: '#aa00ff', colorRgb: '170, 0, 255' });
  }
  if (score >= thresholds.gold) {
    for (let i = 0; i < 3; i++) typesPool.push({ color: 'gold', points: 30, colorHex: '#ffaa00', colorRgb: '255, 170, 0' });
  }
  if (score >= thresholds.rainbow) {
    typesPool.push({ color: 'rainbow', points: 50, colorHex: null, colorRgb: '255, 255, 255' });
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
