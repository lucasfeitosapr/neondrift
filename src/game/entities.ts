import { config } from './config';
import { Crystal, CrystalType, Meteor } from './types';

export function createCrystalEntity(canvas: HTMLCanvasElement, gameSpeed: number, score: number): Crystal {
  const typesPool: CrystalType[] = [];
  typesPool.push({ color: 'cyan', points: 10, colorHex: '#00ffff', colorRgb: '0, 255, 255' });

  if (score >= 150) {
    for (let i = 0; i < 4; i++) typesPool.push({ color: 'purple', points: 20, colorHex: '#aa00ff', colorRgb: '170, 0, 255' });
  }
  if (score >= 350) {
    for (let i = 0; i < 3; i++) typesPool.push({ color: 'gold', points: 30, colorHex: '#ffaa00', colorRgb: '255, 170, 0' });
  }
  if (score >= 500) typesPool.push({ color: 'rainbow', points: 50, colorHex: null, colorRgb: '255, 255, 255' });

  const chosenType = typesPool[Math.floor(Math.random() * typesPool.length)];

  return {
    x: Math.random() * (canvas.width - config.crystal.size),
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

export function createMeteorEntity(canvas: HTMLCanvasElement, gameSpeed: number): Meteor {
  return {
    x: Math.random() * (canvas.width - config.meteor.size),
    y: -config.meteor.size,
    width: config.meteor.size,
    height: config.meteor.size,
    speed: gameSpeed + Math.random() * 3,
    rotation: 0,
    pulse: 0
  };
}
