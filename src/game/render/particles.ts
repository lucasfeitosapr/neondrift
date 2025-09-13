export function drawParticles(state: any) {
  const { ctx, particles, dtFactor, time, particlePool, debug } = state;

  for (let i = particles.length - 1; i >= 0; i--) {
    const particle = particles[i];
    particle.x += particle.vx * dtFactor;
    particle.y += particle.vy * dtFactor;
    particle.life -= particle.decay * dtFactor;

    if (particle.life <= 0) {
      particle.active = false;
      particlePool.release(particle);
      particles.splice(i, 1);
      continue;
    }

    if (debug && debug.particles === false) continue; // update but don't draw

    if (particle.colorType === 'rainbow') {
      const hue = (time * 160 + particle.hueOffset) % 360;
      ctx.fillStyle = `hsla(${hue}, 100%, 60%, ${particle.life})`;
    } else {
      ctx.fillStyle = `rgba(${particle.color}, ${particle.life})`;
    }

    ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
  }
}
