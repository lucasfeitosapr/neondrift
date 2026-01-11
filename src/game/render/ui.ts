import { GameState } from '../types';

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
  const { ctx, canvas } = state;
  if (!state.gameRunning) {
    const lw = (canvas as any)._cssWidth || canvas.width;
    const lh = (canvas as any)._cssHeight || canvas.height;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'; ctx.fillRect(0, 0, lw, lh);
    ctx.fillStyle = '#ff00ff'; ctx.shadowColor = '#ff00ff'; ctx.shadowBlur = 20; ctx.font = 'bold 32px Orbitron'; ctx.textAlign = 'center'; ctx.fillText('G A M E', lw/2, lh/2 - 40); ctx.fillText('O V E R', lw/2, lh/2 - 5);
    ctx.fillStyle = '#00ffff'; ctx.shadowColor = '#00ffff'; ctx.shadowBlur = 15; ctx.font = 'bold 18px Orbitron'; ctx.fillText(`FINAL SCORE: ${state.score.toString().padStart(6, '0')}`, lw/2, lh/2 + 40);
    ctx.font = '12px Orbitron'; ctx.fillText('PRESS ANY KEY TO RESTART', lw/2, lh/2 + 80); ctx.shadowBlur = 0;
  }
}
