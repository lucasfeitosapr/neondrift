import { GameState } from '../types';

export function drawGrid(state: any) {
  const { ctx, canvas, gameSpeed, gridLines, debug } = state as GameState & { debug?: any };
  if (debug && debug.grid === false) return;

  const lw = (canvas as any)._cssWidth || canvas.width;
  const lh = (canvas as any)._cssHeight || canvas.height;

  // Vertical guide lines
  ctx.strokeStyle = 'rgba(255, 0, 255, 0.15)';
  ctx.lineWidth = 1;
  for (let x = 0; x < lw; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, lh); ctx.stroke();
  }

  // Horizontal moving lines
  gridLines.forEach((line: any) => {
    line.y += gameSpeed * 0.5;
    if (line.y > lh + 30) {
      line.y = -30;
      line.opacity = Math.random() * 0.5 + 0.1;
    }
    ctx.strokeStyle = `rgba(0, 255, 255, ${line.opacity})`;
    ctx.beginPath(); ctx.moveTo(0, line.y); ctx.lineTo(lw, line.y); ctx.stroke();
  });
}
