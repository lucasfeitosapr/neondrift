import { GameState, DebugFlags } from '../types';

export function drawParticles(state: GameState & { debug?: DebugFlags }) {
  const { ctx } = state;

  for (let i = state.particles.length - 1; i >= 0; i--) {
    const particle = state.particles[i];
    particle.x += particle.vx * state.dtFactor;
    particle.y += particle.vy * state.dtFactor;
    particle.life -= particle.decay * state.dtFactor;

    if (particle.life <= 0) {
      particle.active = false;
      state.particlePool.release(particle);
      state.particles.splice(i, 1);
      continue;
    }

    if (state.debug && state.debug.particles === false) continue; // update but don't draw

    if (particle.colorType === 'rainbow') {
      const hue = (state.time * 160 + particle.hueOffset) % 360;
      ctx.fillStyle = `hsla(${hue}, 100%, 60%, ${particle.life})`;
    } else {
      ctx.fillStyle = `rgba(${particle.color}, ${particle.life})`;
    }

    ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
  }
}
