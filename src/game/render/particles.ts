import { GameState, DebugFlags } from '../types';

export function drawParticles(state: GameState & { debug?: DebugFlags }): void {
  const { ctx } = state;
  const particles = state.particles;

  // Use swap-and-pop for O(1) removal instead of O(n) splice
  let i = 0;
  while (i < particles.length) {
    const particle = particles[i];
    particle.x += particle.vx * state.dtFactor;
    particle.y += particle.vy * state.dtFactor;
    particle.life -= particle.decay * state.dtFactor;

    if (particle.life <= 0) {
      particle.active = false;
      state.particlePool.release(particle);
      // Swap-and-pop: move last element to current position, then pop
      particles[i] = particles[particles.length - 1];
      particles.pop();
      // Don't increment i - we need to process the swapped element
      continue;
    }

    if (state.debug && state.debug.particles === false) {
      i++;
      continue; // update but don't draw
    }

    if (particle.colorType === 'rainbow') {
      const hue = (state.time * 160 + particle.hueOffset) % 360;
      ctx.fillStyle = `hsla(${hue}, 100%, 60%, ${particle.life})`;
    } else {
      ctx.fillStyle = `rgba(${particle.color}, ${particle.life})`;
    }

    ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
    i++;
  }
}
