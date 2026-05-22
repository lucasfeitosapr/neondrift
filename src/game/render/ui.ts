import { GameState, PowerUpId } from '../types';
import { config } from '../config';
import { removeAtSwap } from '../utils/arrayUtils';

const hudPalette: Record<PowerUpId, string> = {
  magnet: '#7ce7ff',
  time_slow: '#c59bff',
  chain_lightning: '#ffd166'
};

export function drawFloatingTexts(state: GameState & { dtFactor: number }): void {
  const { ctx } = state;
  const useOptimizedRendering = config.rainbowRain.CHAIN_LIGHTNING_USE_LARGE_PARTICLES;
  
  for (let i = state.floatingTexts.length - 1; i >= 0; i--) {
    const ft = state.floatingTexts[i];
    ft.y += ft.vy * state.dtFactor;
    ft.life -= 0.02 * state.dtFactor;
    ctx.save();
    ctx.globalAlpha = Math.max(0, ft.life);
    
    // PERFORMANCE: Disable shadowBlur during chain lightning chaos
    if (!useOptimizedRendering || state.crystals.length < 10) {
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 12 * ft.life;
    }
    
    ctx.fillStyle = ft.color;
    ctx.font = ft.size ? `bold ${ft.size}px Orbitron` : 'bold 14px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
    if (ft.life <= 0) removeAtSwap(state.floatingTexts, i);
  }
}

export function drawUI(state: GameState & { gameRunning: boolean; score: number; highScore: number }): void {
  const { ctx, canvas, activePowerUps, gameRunning } = state;
  const lw = state.viewport?.width ?? canvas.width;
  const lh = state.viewport?.height ?? canvas.height;
  const useOptimizedRendering = config.rainbowRain.CHAIN_LIGHTNING_USE_LARGE_PARTICLES;

  // Run-type badge (top-right), shown during gameplay
  if (gameRunning && state.runSeed) {
    const isDaily = state.runSeed.isDailyRun;
    const isManual = state.runSeed.source === 'manual';
    if (isDaily || isManual) {
      ctx.save();
      ctx.font = 'bold 10px Orbitron';
      ctx.textAlign = 'right';
      ctx.fillStyle = isDaily ? '#ffaa00' : '#c59bff';
      ctx.shadowColor = isDaily ? '#ffaa00' : '#c59bff';
      ctx.shadowBlur = 10;
      ctx.fillText(isDaily ? '◈ DAILY' : '◈ SEED RUN', lw - 10, 18);
      ctx.restore();
    }
  }

  // Active power-up HUD (top-left)
  if (gameRunning) {
    ctx.save();
    ctx.font = '12px Orbitron';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#7ce7ff';
    
    // PERFORMANCE: Disable shadowBlur during chain lightning chaos
    if (!useOptimizedRendering || state.crystals.length < 10) {
      ctx.shadowColor = '#7ce7ff';
      ctx.shadowBlur = 12;
    }
    
    ctx.fillText('Power-Ups', 10, 20);
    ctx.shadowBlur = 0;
    activePowerUps.forEach((p, idx) => {
      const remainingMs = p.expiresAt ? Math.max(0, p.expiresAt - performance.now()) : 0;
      const remaining = p.expiresAt ? `${(remainingMs / 1000).toFixed(1)}s` : '∞';
      const color = hudPalette[p.id as PowerUpId] || '#a7fffb';
      const label = `${p.id} ${remaining}`;
      ctx.fillStyle = color;
      ctx.fillText(label.toUpperCase(), 10, 40 + idx * 16);
    });
    if (activePowerUps.length === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillText('none', 10, 40);
    }
    ctx.restore();
  }

  if (state.paused && gameRunning) {
    ctx.save();
    ctx.fillStyle = 'rgba(5, 0, 20, 0.65)';
    ctx.fillRect(0, 0, lw, lh);
    ctx.textAlign = 'center';
    ctx.font = 'bold 42px Orbitron';
    ctx.fillStyle = '#ff00ff';
    ctx.shadowColor = '#ff00ff';
    ctx.shadowBlur = 30;
    ctx.fillText('P A U S E D', lw / 2, lh / 2 - 10);
    ctx.font = '16px Orbitron';
    ctx.fillStyle = '#00ffff';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 15;
    ctx.fillText('Press P or click RESUME', lw / 2, lh / 2 + 30);
    ctx.restore();
  }

  if (state.resumeCountdownActive && typeof state.resumeCountdownValue === 'number') {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, lw, lh);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff00ff';
    ctx.shadowColor = '#ff00ff';
    ctx.shadowBlur = 25;
    ctx.font = 'bold 80px Orbitron';
    ctx.fillText(state.resumeCountdownValue.toString(), lw / 2, lh / 2);
    ctx.font = '18px Orbitron';
    ctx.fillStyle = '#00ffff';
    ctx.shadowColor = '#00ffff';
    ctx.fillText('GET READY', lw / 2, lh / 2 + 50);
    ctx.restore();
  }

  if (!state.gameRunning) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, lw, lh);

    // Daily challenge header (above GAME OVER)
    if (state.runSeed?.isDailyRun) {
      const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
      ctx.font = 'bold 13px Orbitron';
      ctx.fillStyle = '#ffaa00';
      ctx.shadowColor = '#ffaa00';
      ctx.shadowBlur = 18;
      ctx.fillText(`◈ DAILY CHALLENGE · ${today}`, lw / 2, lh / 2 - 78);
    }

    // GAME OVER
    ctx.fillStyle = '#ff00ff'; ctx.shadowColor = '#ff00ff'; ctx.shadowBlur = 20;
    ctx.font = 'bold 32px Orbitron';
    ctx.fillText('G A M E', lw / 2, lh / 2 - 40);
    ctx.fillText('O V E R', lw / 2, lh / 2 - 5);

    // Final score
    ctx.fillStyle = '#00ffff'; ctx.shadowColor = '#00ffff'; ctx.shadowBlur = 15;
    ctx.font = 'bold 18px Orbitron';
    ctx.fillText(`FINAL SCORE: ${state.score.toString().padStart(6, '0')}`, lw / 2, lh / 2 + 40);

    if (state._awaitingQuantumSeed) {
      ctx.font = '10px Orbitron';
      ctx.fillStyle = 'rgba(255, 170, 0, 0.6)';
      ctx.shadowColor = '#ffaa00';
      ctx.shadowBlur = 8;
      ctx.fillText('CONNECTING TO ANU QRNG...', lw / 2, lh / 2 + 80);
    } else {
      ctx.font = '12px Orbitron';
      ctx.fillStyle = '#00ffff';
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 10;
      ctx.fillText('PRESS ENTER TO RESTART', lw / 2, lh / 2 + 80);

      if (state.runSeed) {
        const { hex, source, measuredAt } = state.runSeed;
        const abbrev = hex.slice(0, 4) + '...' + hex.slice(-4);
        const time = new Date(measuredAt).toLocaleTimeString();
        const sourceLabel = source === 'quantum' ? `measured ${time} · ANU QRNG`
          : source === 'manual' ? 'replayed seed'
          : 'local entropy';

        if (state._seedCopied) {
          ctx.font = 'bold 10px Orbitron';
          ctx.fillStyle = '#ffaa00';
          ctx.shadowColor = '#ffaa00';
          ctx.shadowBlur = 12;
          ctx.fillText('SEED COPIED ✓', lw / 2, lh / 2 + 108);
        } else {
          ctx.font = '10px Orbitron';
          ctx.fillStyle = 'rgba(0, 255, 255, 0.35)';
          ctx.shadowBlur = 0;
          ctx.fillText(`RUN SEED: ${abbrev} · ${sourceLabel}`, lw / 2, lh / 2 + 104);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.font = '9px Orbitron';
          ctx.fillText('PRESS C TO COPY', lw / 2, lh / 2 + 120);
        }
      }
    }
    ctx.restore();
  }
}
