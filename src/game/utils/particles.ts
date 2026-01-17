import { GameState, Particle, ParticleColorMode } from '../types';
import { config } from '../config';

export function spawnParticleFromPool(
  state: Pick<GameState, 'particlePool' | 'particles'>,
  x: number,
  y: number,
  vx: number,
  vy: number,
  life: number,
  decay: number,
  size: number,
  color: string | null,
  colorType: ParticleColorMode,
  hueOffset?: number
): Particle {
  const p: Particle = state.particlePool.borrow();
  p.active = true;
  p.x = x;
  p.y = y;
  p.vx = vx;
  p.vy = vy;
  p.life = life;
  p.decay = decay;
  p.size = size;
  
  if (colorType === 'rainbow') {
    p.colorType = 'rainbow';
    p.hueOffset = hueOffset || 0;
    p.color = null;
  } else {
    p.colorType = 'rgb';
    p.color = color;
    p.hueOffset = 0;
  }
  
  state.particles.push(p);
  return p;
}

export function createParticle(
  state: Pick<GameState, 'particlePool' | 'particles'>,
  x: number,
  y: number,
  color: string | 'rainbow',
  customDecay?: number
): void {
  if (color === 'rainbow') {
    const decay = customDecay ?? config.particles.DECAY_RAINBOW;
    for (let i = 0; i < 16; i++) {
      const vx = (Math.random() - 0.5) * 8;
      const vy = (Math.random() - 0.5) * 8;
      spawnParticleFromPool(
        state,
        x,
        y,
        vx,
        vy,
        1,
        decay,
        Math.random() * 4 + 1.5,
        null,
        'rainbow',
        Math.random() * 360
      );
    }
  } else {
    const decay = customDecay ?? config.particles.DECAY_NORMAL;
    for (let i = 0; i < 10; i++) {
      const vx = (Math.random() - 0.5) * 6;
      const vy = (Math.random() - 0.5) * 6;
      spawnParticleFromPool(
        state,
        x,
        y,
        vx,
        vy,
        1,
        decay,
        Math.random() * 3 + 1.5,
        color as string,
        'rgb',
        0
      );
    }
  }
}
