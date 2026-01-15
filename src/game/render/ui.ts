import { GameState, PowerUpId } from '../types';

const hudPalette: Record<PowerUpId, string> = {
  magnet: '#7ce7ff',
  time_slow: '#c59bff',
  chain_lightning: '#ffd166'
};

export function drawFloatingTexts(state: GameState & { dtFactor: number }) {
  const { ctx } = state;
  for (let i = state.floatingTexts.length - 1; i >= 0; i--) {
    const ft = state.floatingTexts[i];
    ft.y += ft.vy * state.dtFactor;
    ft.life -= 0.02 * state.dtFactor;
    ctx.save();
    ctx.globalAlpha = Math.max(0, ft.life);
    ctx.shadowColor = ft.color;
    ctx.shadowBlur = 12 * ft.life;
    ctx.fillStyle = ft.color;
    ctx.font = 'bold 14px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
    if (ft.life <= 0) state.floatingTexts.splice(i, 1);
  }
}

export function drawUI(state: GameState & { gameRunning: boolean; score: number; highScore: number }) {
  const { ctx, canvas, activePowerUps, gameRunning } = state;
  const lw = state.viewport?.width ?? canvas.width;
  const lh = state.viewport?.height ?? canvas.height;

  // Active power-up HUD (top-left)
  if (gameRunning) {
    ctx.save();
    ctx.font = '12px Orbitron';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#7ce7ff';
    ctx.shadowColor = '#7ce7ff';
    ctx.shadowBlur = 12;
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
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'; ctx.fillRect(0, 0, lw, lh);
    ctx.fillStyle = '#ff00ff'; ctx.shadowColor = '#ff00ff'; ctx.shadowBlur = 20; ctx.font = 'bold 32px Orbitron'; ctx.textAlign = 'center'; ctx.fillText('G A M E', lw/2, lh/2 - 40); ctx.fillText('O V E R', lw/2, lh/2 - 5);
    ctx.fillStyle = '#00ffff'; ctx.shadowColor = '#00ffff'; ctx.shadowBlur = 15; ctx.font = 'bold 18px Orbitron'; ctx.fillText(`FINAL SCORE: ${state.score.toString().padStart(6, '0')}`, lw/2, lh/2 + 40);
    ctx.font = '12px Orbitron'; ctx.fillText('PRESS ENTER KEY TO RESTART', lw/2, lh/2 + 80); ctx.shadowBlur = 0;
  }
}
