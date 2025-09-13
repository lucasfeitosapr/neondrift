export function drawEntities(state: any) {
  const { ctx, player, crystals, meteors, time, debug } = state;

  // Player
  player.trail.push({ x: player.x + player.width/2, y: player.y + player.height/2 });
  if (player.trail.length > 8) player.trail.shift();
  for (let i = 0; i < player.trail.length; i++) {
    const alpha = i / player.trail.length * 0.5;
    const size = (i / player.trail.length) * 4;
    ctx.fillStyle = `rgba(0, 255, 255, ${alpha})`;
    ctx.fillRect(player.trail[i].x - size/2, player.trail[i].y - size/2, size, size);
  }
  ctx.fillStyle = '#00ffff'; ctx.shadowColor = '#00ffff'; ctx.shadowBlur = 15;
  ctx.beginPath(); ctx.moveTo(player.x + player.width/2, player.y); ctx.lineTo(player.x, player.y + player.height); ctx.lineTo(player.x + player.width, player.y + player.height); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ff00ff'; ctx.shadowColor = '#ff00ff'; ctx.shadowBlur = 10; ctx.fillRect(player.x + player.width/2 - 3, player.y + 10, 6, 15);
  ctx.shadowBlur = 0;

  // Debug: player bounding box
  if (debug && debug.boxes) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.9)';
    ctx.lineWidth = 1;
    ctx.shadowBlur = 0;
    ctx.strokeRect(player.x, player.y, player.width, player.height);
    ctx.restore();
  }

  // Crystals
  crystals.forEach((crystal: any) => {
    crystal.rotation += 0.1;
    ctx.save(); ctx.translate(crystal.x + crystal.width/2, crystal.y + crystal.height/2); ctx.rotate(crystal.rotation);
    let mainColor = crystal.type.colorHex || '#00ffff'; let shadowColor = mainColor;
    if (crystal.type.color === 'rainbow') { const hue = (time * 120 + crystal.hueOffset) % 360; mainColor = `hsl(${hue}, 100%, 60%)`; shadowColor = mainColor; }
    ctx.shadowColor = shadowColor; ctx.shadowBlur = 20 * crystal.glow;
    ctx.fillStyle = mainColor; ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(8, 0); ctx.lineTo(0, 12); ctx.lineTo(-8, 0); ctx.closePath(); ctx.fill();
    let innerColor = '#ffffff'; if (crystal.type.color === 'rainbow') { const hueInner = (time * 120 + crystal.hueOffset + 45) % 360; innerColor = `hsl(${hueInner}, 100%, 70%)`; }
    ctx.fillStyle = innerColor; ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(4, 0); ctx.lineTo(0, 6); ctx.lineTo(-4, 0); ctx.closePath(); ctx.fill();
    ctx.restore(); ctx.shadowBlur = 0;

    // Debug: crystal bounding box (axis-aligned)
    if (debug && debug.boxes) {
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.9)';
      ctx.lineWidth = 1;
      ctx.shadowBlur = 0;
      ctx.strokeRect(crystal.x, crystal.y, crystal.width, crystal.height);
      // optional: draw center
      ctx.fillStyle = 'rgba(0,255,255,0.9)';
      ctx.fillRect(crystal.x + crystal.width/2 - 1, crystal.y + crystal.height/2 - 1, 2, 2);
      ctx.restore();
    }
  });

  // Meteors
  meteors.forEach((meteor: any) => {
    meteor.rotation += 0.05; meteor.pulse += 0.1;
    ctx.save(); ctx.translate(meteor.x + meteor.width/2, meteor.y + meteor.height/2); ctx.rotate(meteor.rotation);
    const glowIntensity = Math.sin(meteor.pulse) * 0.3 + 0.7; ctx.shadowColor = '#ff00ff'; ctx.shadowBlur = 25 * glowIntensity;
    ctx.fillStyle = '#ff00ff'; ctx.fillRect(-15, -15, 30, 30);
    ctx.fillStyle = '#ff6666'; ctx.fillRect(-8, -8, 16, 16);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-10, -10); ctx.lineTo(10, 10); ctx.moveTo(10, -10); ctx.lineTo(-10, 10); ctx.stroke();
    ctx.restore(); ctx.shadowBlur = 0;

    // Debug: meteor bounding box (axis-aligned)
    if (debug && debug.boxes) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 0, 255, 0.9)';
      ctx.lineWidth = 1;
      ctx.shadowBlur = 0;
      ctx.strokeRect(meteor.x, meteor.y, meteor.width, meteor.height);
      ctx.fillStyle = 'rgba(255,0,255,0.9)';
      ctx.fillRect(meteor.x + meteor.width/2 - 1, meteor.y + meteor.height/2 - 1, 2, 2);
      ctx.restore();
    }
  });
}
