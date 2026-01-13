import { ChainLightningArc, DebugFlags, GameState } from '../types';

// ═══════════════════════════════════════════════════════════════
// CHAIN LIGHTNING RENDERING - MAXIMUM IMPACT! ⚡
// ═══════════════════════════════════════════════════════════════
export function drawChainLightning(state: GameState) {
  const { ctx, chainLightningArcs, time, canvas } = state;
  if (!chainLightningArcs || chainLightningArcs.length === 0) return;
  
  const lw = (canvas as any)._cssWidth || canvas.width;
  const lh = (canvas as any)._cssHeight || canvas.height;
  
  ctx.save();
  
  // ⚡ SCREEN FLASH on fresh lightning (life > 0.9)
  const hasActiveLightning = chainLightningArcs.some(a => a.life > 0.85);
  if (hasActiveLightning) {
    const flashIntensity = Math.max(...chainLightningArcs.map(a => a.life > 0.85 ? (a.life - 0.85) * 6 : 0));
    ctx.fillStyle = `rgba(255, 255, 255, ${flashIntensity * 0.15})`;
    ctx.fillRect(0, 0, lw, lh);
  }
  
  for (const arc of chainLightningArcs) {
    if (arc.life <= 0 || arc.segments.length < 2) continue;
    
    const alpha = arc.life;
    const glowIntensity = arc.life * 45; // MORE GLOW!
    
    // Layer 1: MASSIVE outer glow (blur)
    ctx.strokeStyle = arc.color;
    ctx.shadowColor = arc.color;
    ctx.shadowBlur = glowIntensity * 1.5;
    ctx.lineWidth = 12 * arc.life;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = alpha * 0.3;
    
    ctx.beginPath();
    ctx.moveTo(arc.segments[0].x, arc.segments[0].y);
    for (let i = 1; i < arc.segments.length; i++) {
      ctx.lineTo(arc.segments[i].x, arc.segments[i].y);
    }
    ctx.stroke();
    
    // Layer 2: Mid glow (colored)
    ctx.shadowBlur = glowIntensity;
    ctx.lineWidth = 6 * arc.life;
    ctx.globalAlpha = alpha * 0.6;
    ctx.stroke();
    
    // Layer 3: Core (white-hot)
    ctx.strokeStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = glowIntensity * 0.6;
    ctx.lineWidth = 3 * arc.life;
    ctx.globalAlpha = alpha;
    ctx.stroke();
    
    // ⚡ BRANCHING FORKS - small lightning offshoots
    ctx.lineWidth = 1.5 * arc.life;
    ctx.globalAlpha = alpha * 0.7;
    for (let i = 1; i < arc.segments.length - 1; i += 2) {
      const seg = arc.segments[i];
      // Random fork direction
      const forkAngle = Math.random() * Math.PI * 2;
      const forkLen = 8 + Math.random() * 15;
      const forkX = seg.x + Math.cos(forkAngle) * forkLen;
      const forkY = seg.y + Math.sin(forkAngle) * forkLen;
      
      ctx.beginPath();
      ctx.moveTo(seg.x, seg.y);
      // Add a little jitter to the fork
      const midX = (seg.x + forkX) / 2 + (Math.random() - 0.5) * 8;
      const midY = (seg.y + forkY) / 2 + (Math.random() - 0.5) * 8;
      ctx.lineTo(midX, midY);
      ctx.lineTo(forkX, forkY);
      ctx.stroke();
    }
    
    // ⚡ SPARKS along the path
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 12;
    ctx.globalAlpha = alpha * 0.9;
    
    for (let i = 0; i < arc.segments.length; i++) {
      const seg = arc.segments[i];
      // Flicker effect
      if (Math.sin(time * 40 + i * 3) > 0.3) {
        const sparkSize = (i === 0 || i === arc.segments.length - 1) ? 5 : 2.5;
        ctx.beginPath();
        ctx.arc(seg.x, seg.y, sparkSize * arc.life, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // ⚡ BIG IMPACT SPARK at endpoint
    const endPt = arc.segments[arc.segments.length - 1];
    ctx.fillStyle = arc.color;
    ctx.shadowColor = arc.color;
    ctx.shadowBlur = 25 * arc.life;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(endPt.x, endPt.y, 8 * arc.life, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(endPt.x, endPt.y, 4 * arc.life, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.restore();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

export function drawEntities(state: GameState & { debug?: DebugFlags }) {
  const { ctx, player, crystals, meteors, powerUpPickups } = state;

  // Player
  if (player) {
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
    if ((state as any).debug && (state as any).debug.boxes) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.9)';
      ctx.lineWidth = 1;
      ctx.shadowBlur = 0;
      ctx.strokeRect(player.x, player.y, player.width, player.height);
      ctx.restore();
    }
  }

  // Crystals
  crystals.forEach((crystal: any) => {
    crystal.rotation += 0.1;
    ctx.save(); ctx.translate(crystal.x + crystal.width/2, crystal.y + crystal.height/2); ctx.rotate(crystal.rotation);
    let mainColor = crystal.type.colorHex || '#00ffff'; let shadowColor = mainColor;
    if (crystal.type.color === 'rainbow') { const hue = (state.time * 120 + crystal.hueOffset) % 360; mainColor = `hsl(${hue}, 100%, 60%)`; shadowColor = mainColor; }
    ctx.shadowColor = shadowColor; ctx.shadowBlur = 20 * crystal.glow;
    ctx.fillStyle = mainColor; ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(8, 0); ctx.lineTo(0, 12); ctx.lineTo(-8, 0); ctx.closePath(); ctx.fill();
    let innerColor = '#ffffff'; if (crystal.type.color === 'rainbow') { const hueInner = (state.time * 120 + crystal.hueOffset + 45) % 360; innerColor = `hsl(${hueInner}, 100%, 70%)`; }
    ctx.fillStyle = innerColor; ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(4, 0); ctx.lineTo(0, 6); ctx.lineTo(-4, 0); ctx.closePath(); ctx.fill();
    ctx.restore(); ctx.shadowBlur = 0;

    // Debug: crystal bounding box (axis-aligned)
    if ((state as any).debug && (state as any).debug.boxes) {
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.9)';
      ctx.lineWidth = 1;
      ctx.shadowBlur = 0;
      ctx.strokeRect(crystal.x, crystal.y, crystal.width, crystal.height);
      ctx.fillStyle = 'rgba(0,255,255,0.9)';
      ctx.fillRect(crystal.x + crystal.width/2 - 1, crystal.y + crystal.height/2 - 1, 2, 2);
      ctx.restore();
    }
  });

  // Power-up pickups
  powerUpPickups.forEach((pickup: any) => {
    const t = state.time;
    const cx = pickup.x + pickup.width / 2;
    const cy = pickup.y + pickup.height / 2;

    if (pickup.id === 'magnet') {
      const pulse = (Math.sin(t * 4) + 1) * 0.5;
      const style = pickup.style || 'horseshoe';
      
      ctx.save();
      ctx.translate(cx, cy);
      
      // ════════════════════════════════════════════════════════════
      // STYLE: HORSESHOE - Classic magnet shape with red/blue poles
      // ════════════════════════════════════════════════════════════
      if (style === 'horseshoe') {
        // Orbiting attraction particles
        for (let i = 0; i < 3; i++) {
          const angle = t * 3 + (i * Math.PI * 2 / 3);
          const orbitRadius = 16 + pulse * 2;
          const px = Math.cos(angle) * orbitRadius;
          const py = Math.sin(angle) * orbitRadius;
          ctx.fillStyle = `rgba(255, 100, 50, ${0.6 + pulse * 0.4})`;
          ctx.shadowColor = '#ff6432';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(px, py, 2 + pulse, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.shadowColor = '#ff4444';
        ctx.shadowBlur = 12 + pulse * 6;
        
        // Left pole (red)
        ctx.fillStyle = '#ff4455';
        ctx.beginPath();
        ctx.roundRect(-10, -4, 6, 14, 2);
        ctx.fill();
        
        // Right pole (blue)
        ctx.fillStyle = '#4488ff';
        ctx.shadowColor = '#4488ff';
        ctx.beginPath();
        ctx.roundRect(4, -4, 6, 14, 2);
        ctx.fill();
        
        // Top arc
        ctx.strokeStyle = '#888899';
        ctx.shadowColor = '#aaaacc';
        ctx.shadowBlur = 8;
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, -4, 7, Math.PI, 0, false);
        ctx.stroke();
        
        // Inner highlight
        ctx.strokeStyle = '#bbbbcc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -4, 5, Math.PI * 0.8, Math.PI * 0.2, false);
        ctx.stroke();
      }
      
      // ════════════════════════════════════════════════════════════
      // STYLE: VORTEX - Spinning spiral with particles being pulled in
      // ════════════════════════════════════════════════════════════
      else if (style === 'vortex') {
        const rotation = t * 2;
        
        // Spiral arms
        for (let arm = 0; arm < 3; arm++) {
          const armOffset = (arm * Math.PI * 2) / 3;
          ctx.beginPath();
          for (let i = 0; i < 20; i++) {
            const angle = rotation + armOffset + i * 0.3;
            const radius = 3 + i * 0.6;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          const hue = (arm * 120 + t * 60) % 360;
          ctx.strokeStyle = `hsl(${hue}, 100%, 60%)`;
          ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
          ctx.shadowBlur = 10 + pulse * 5;
          ctx.lineWidth = 2 + pulse;
          ctx.lineCap = 'round';
          ctx.stroke();
        }
        
        // Center core
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(0, 0, 3 + pulse * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Particles spiraling in
        for (let i = 0; i < 5; i++) {
          const pAngle = t * 4 + i * 1.2;
          const pRadius = 14 - (t * 3 + i * 2) % 12;
          const px = Math.cos(pAngle) * pRadius;
          const py = Math.sin(pAngle) * pRadius;
          ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + (1 - pRadius / 14) * 0.7})`;
          ctx.shadowBlur = 5;
          ctx.beginPath();
          ctx.arc(px, py, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      
      // ════════════════════════════════════════════════════════════
      // STYLE: RING - Pulsing concentric rings with energy
      // ════════════════════════════════════════════════════════════
      else if (style === 'ring') {
        // Outer ring
        ctx.strokeStyle = '#ff6b9d';
        ctx.shadowColor = '#ff6b9d';
        ctx.shadowBlur = 12 + pulse * 8;
        ctx.lineWidth = 2 + pulse;
        ctx.beginPath();
        ctx.arc(0, 0, 10 + pulse * 2, 0, Math.PI * 2);
        ctx.stroke();
        
        // Middle ring (counter-rotating dashes)
        ctx.strokeStyle = '#9d6bff';
        ctx.shadowColor = '#9d6bff';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.save();
        ctx.rotate(-t * 3);
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        ctx.setLineDash([]);
        
        // Inner core with glow
        const coreHue = (t * 100) % 360;
        ctx.fillStyle = `hsl(${coreHue}, 80%, 60%)`;
        ctx.shadowColor = `hsl(${coreHue}, 100%, 50%)`;
        ctx.shadowBlur = 15 + pulse * 10;
        ctx.beginPath();
        ctx.arc(0, 0, 3 + pulse, 0, Math.PI * 2);
        ctx.fill();
        
        // Energy sparks
        for (let i = 0; i < 4; i++) {
          const sparkAngle = t * 5 + (i * Math.PI / 2);
          const sparkDist = 7 + Math.sin(t * 8 + i) * 3;
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(Math.cos(sparkAngle) * sparkDist, Math.sin(sparkAngle) * sparkDist, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      
      // ════════════════════════════════════════════════════════════
      // STYLE: FIELD - Magnetic field lines visualization
      // ════════════════════════════════════════════════════════════
      else if (style === 'field') {
        // Field lines (curved paths from pole to pole)
        const fieldLines = 5;
        for (let i = 0; i < fieldLines; i++) {
          const offset = (i - (fieldLines - 1) / 2) * 3;
          const animOffset = Math.sin(t * 3 + i * 0.5) * 2;
          
          ctx.beginPath();
          ctx.moveTo(-8, 8);
          ctx.bezierCurveTo(
            -8 + offset, -5 + animOffset,
            8 + offset, -5 + animOffset,
            8, 8
          );
          
          const alpha = 0.4 + Math.abs(offset) * 0.1;
          ctx.strokeStyle = `rgba(100, 200, 255, ${alpha})`;
          ctx.shadowColor = '#64c8ff';
          ctx.shadowBlur = 6;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
        
        // North pole (red dot)
        ctx.fillStyle = '#ff4466';
        ctx.shadowColor = '#ff4466';
        ctx.shadowBlur = 10 + pulse * 5;
        ctx.beginPath();
        ctx.arc(-8, 8, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 5px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('N', -8, 10);
        
        // South pole (blue dot)
        ctx.fillStyle = '#4488ff';
        ctx.shadowColor = '#4488ff';
        ctx.shadowBlur = 10 + pulse * 5;
        ctx.beginPath();
        ctx.arc(8, 8, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillText('S', 8, 10);
        
        // Moving particles along field lines
        for (let i = 0; i < 3; i++) {
          const progress = (t * 0.5 + i * 0.33) % 1;
          const curveX = -8 + progress * 16;
          const curveY = 8 - Math.sin(progress * Math.PI) * 13;
          ctx.fillStyle = `rgba(255, 255, 255, ${0.8 - progress * 0.5})`;
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(curveX, curveY, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      
      ctx.restore();
      ctx.shadowBlur = 0;
    } else {
      // Other power-ups: hexagon style
      const palettes: Record<string, { stroke: string; fill: string; glyph: string }> = {
        time_slow: { stroke: '#c59bff', fill: 'rgba(197, 155, 255, 0.22)', glyph: 'S' },
        chain_lightning: { stroke: '#ffd166', fill: 'rgba(255, 209, 102, 0.22)', glyph: 'L' }
      };
      const palette = palettes[pickup.id] || { stroke: '#ffffff', fill: 'rgba(255,255,255,0.2)', glyph: '?' };
      const pulse = (Math.sin(t * 5) + 1) * 0.5;
      const rotate = Math.sin(t * 3 + pickup.y * 0.01) * 0.18;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotate);
      ctx.shadowColor = palette.stroke;
      ctx.shadowBlur = 14 + pulse * 8;
      ctx.strokeStyle = palette.stroke;
      ctx.lineWidth = 2 + pulse * 0.8;
      ctx.beginPath();
      ctx.moveTo(0, -12); ctx.lineTo(10, -6); ctx.lineTo(10, 6); ctx.lineTo(0, 12); ctx.lineTo(-10, 6); ctx.lineTo(-10, -6); ctx.closePath();
      ctx.stroke();
      ctx.fillStyle = palette.fill;
      ctx.fill();
      ctx.fillStyle = '#0f1320';
      ctx.font = 'bold 10px Orbitron';
      ctx.textAlign = 'center';
      ctx.fillText(palette.glyph, 0, 3);
      ctx.restore();
      ctx.shadowBlur = 0;
    }

    if ((state as any).debug && (state as any).debug.boxes) {
      const debugColor = pickup.id === 'magnet' ? '#ff6644' : '#c59bff';
      ctx.save();
      ctx.strokeStyle = debugColor;
      ctx.lineWidth = 1;
      ctx.shadowBlur = 0;
      ctx.strokeRect(pickup.x, pickup.y, pickup.width, pickup.height);
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
    if ((state as any).debug && (state as any).debug.boxes) {
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
