export function drawFloatingTexts(state: any) {
  const { ctx, floatingTexts, dtFactor } = state;
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const ft = floatingTexts[i];
    ft.y += ft.vy * dtFactor;
    ft.life -= 0.02 * dtFactor;
    ctx.save();
    ctx.globalAlpha = Math.max(0, ft.life);
    ctx.shadowColor = ft.color;
    ctx.shadowBlur = 12 * ft.life;
    ctx.fillStyle = ft.color;
    ctx.font = 'bold 14px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
    if (ft.life <= 0) floatingTexts.splice(i, 1);
  }
}

export function drawUI(state: any) {
  const { ctx, canvas, score, highScore, gameRunning } = state;
  if (!gameRunning) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ff00ff'; ctx.shadowColor = '#ff00ff'; ctx.shadowBlur = 20; ctx.font = 'bold 32px Orbitron'; ctx.textAlign = 'center'; ctx.fillText('G A M E', canvas.width/2, canvas.height/2 - 40); ctx.fillText('O V E R', canvas.width/2, canvas.height/2 - 5);
    ctx.fillStyle = '#00ffff'; ctx.shadowColor = '#00ffff'; ctx.shadowBlur = 15; ctx.font = 'bold 18px Orbitron'; ctx.fillText(`FINAL SCORE: ${score.toString().padStart(6, '0')}`, canvas.width/2, canvas.height/2 + 40);
    ctx.font = '12px Orbitron'; ctx.fillText('PRESS ANY KEY TO RESTART', canvas.width/2, canvas.height/2 + 80); ctx.shadowBlur = 0;
  }
}
