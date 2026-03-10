import { config } from '../config';
import { DebugFlags, GameState } from '../types';

// ═══════════════════════════════════════════════════════════════
// TIME SLOW EFFECTS - Scanlines & Ripple
// ═══════════════════════════════════════════════════════════════
export function drawTimeSlowEffects(state: GameState): void {
  const { ctx, canvas, activePowerUps, timeSlowRipples, pendingRevengeMeteors, time } = state;
  const lw = state.viewport?.width ?? canvas.width;
  const lh = state.viewport?.height ?? canvas.height;
  
  const isTimeSlowActive = activePowerUps.some(p => p.id === 'time_slow');
  const now = performance.now();

  const revengeWarning = {
    windowMinMs: 60,
    windowMaxMs: 140,
    intensityScale: 0.55,
    pulseSpeed: 0.90,
    topBandMaxPx: 80,
    topBandMaxRatio: 0.18,
    indicatorHalfWidth: 10,
    indicatorTopY: 6,
    indicatorBaseY: 22,
    indicatorAlphaBoost: 0.35,
    lineAlphaScale: 0.75,
    lineWidth: 12,
    dashSegmentPx: 5
  };
  
  ctx.save();
  
  // ═══════════════════════════════════════════════════════════════
  // REVENGE WARNING FLASH - Screen edge danger indicator!
  // ═══════════════════════════════════════════════════════════════
  if (config.timeSlow.revenge.WARNING_FLASH && pendingRevengeMeteors.length > 0) {
    for (const pending of pendingRevengeMeteors) {
      const timeUntilSpawn = pending.spawnAt - now;
      const warningWindowMs = Math.max(
        revengeWarning.windowMinMs,
        Math.min(revengeWarning.windowMaxMs, config.timeSlow.revenge.DELAY_MS)
      );
      if (timeUntilSpawn > 0 && timeUntilSpawn <= warningWindowMs) {
        const t = 1 - timeUntilSpawn / warningWindowMs;
        const intensity = t * revengeWarning.intensityScale;
        const pulseIntensity = intensity * (0.5 + Math.sin(now * revengeWarning.pulseSpeed) * 0.5);

        const topBandHeight = Math.min(revengeWarning.topBandMaxPx, lh * revengeWarning.topBandMaxRatio);
        const topBand = ctx.createLinearGradient(0, 0, 0, topBandHeight);
        topBand.addColorStop(0, `rgba(255, 0, 68, ${pulseIntensity})`);
        topBand.addColorStop(1, 'rgba(255, 0, 68, 0)');
        ctx.fillStyle = topBand;
        ctx.fillRect(0, 0, lw, topBandHeight);

        const indicatorX = pending.targetX;
        ctx.fillStyle = `rgba(255, 0, 68, ${Math.min(1, intensity + revengeWarning.indicatorAlphaBoost)})`;
        ctx.shadowColor = '#ff0044';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(indicatorX, revengeWarning.indicatorTopY);
        ctx.lineTo(indicatorX - revengeWarning.indicatorHalfWidth, revengeWarning.indicatorBaseY);
        ctx.lineTo(indicatorX + revengeWarning.indicatorHalfWidth, revengeWarning.indicatorBaseY);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = `rgba(255, 0, 68, ${intensity * revengeWarning.lineAlphaScale})`;
        ctx.lineWidth = revengeWarning.lineWidth;
        ctx.setLineDash([revengeWarning.dashSegmentPx, revengeWarning.dashSegmentPx]);
        ctx.beginPath();
        ctx.moveTo(indicatorX, 0);
        ctx.lineTo(indicatorX, topBandHeight);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }
  
  // ═══════════════════════════════════════════════════════════════
  // RIPPLE EFFECT - Expanding circular wave on activation
  // ═══════════════════════════════════════════════════════════════
  if (config.timeSlow.EFFECT_RIPPLE && timeSlowRipples.length > 0) {
    for (const ripple of timeSlowRipples) {
      const elapsed = now - ripple.startTime;
      const progress = Math.min(1, elapsed / ripple.durationMs);
      const radius = progress * ripple.maxRadius;
      const alpha = (1 - progress) * 0.6;
      
      // Multiple concentric rings for depth
      for (let ring = 0; ring < 3; ring++) {
        const ringRadius = radius - ring * 20;
        if (ringRadius <= 0) continue;
        
        const ringAlpha = alpha * (1 - ring * 0.3);
        const lineWidth = 3 - ring;
        
        ctx.strokeStyle = `rgba(197, 155, 255, ${ringAlpha})`;
        ctx.shadowColor = '#c59bff';
        ctx.shadowBlur = 15 - ring * 4;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ringRadius, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      // Inner distortion ring (white flash)
      if (progress < 0.3) {
        const flashAlpha = (0.3 - progress) * 2;
        ctx.strokeStyle = `rgba(255, 255, 255, ${flashAlpha})`;
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 20;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, radius * 0.3, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }
  
  // ═══════════════════════════════════════════════════════════════
  // SCANLINES EFFECT - CRT-style overlay during slow-mo
  // ═══════════════════════════════════════════════════════════════
  if (config.timeSlow.EFFECT_SCANLINES && isTimeSlowActive) {
    const scanlineOpacity = config.timeSlow.SCANLINE_OPACITY;
    const scrollOffset = (time * config.timeSlow.SCANLINE_SPEED * 60) % 4;
    
    // Horizontal scanlines
    ctx.fillStyle = `rgba(0, 0, 0, ${scanlineOpacity})`;
    for (let y = scrollOffset; y < lh; y += 4) {
      ctx.fillRect(0, y, lw, 2);
    }
    
    // Subtle purple tint overlay
    ctx.fillStyle = 'rgba(197, 155, 255, 0.03)';
    ctx.fillRect(0, 0, lw, lh);
    
    // Edge vignette (darker corners for CRT feel)
    const gradient = ctx.createRadialGradient(lw / 2, lh / 2, lh * 0.3, lw / 2, lh / 2, lh * 0.8);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.15)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, lw, lh);
    
    // Occasional flicker (subtle)
    if (Math.sin(time * 30) > 0.95) {
      ctx.fillStyle = 'rgba(197, 155, 255, 0.02)';
      ctx.fillRect(0, 0, lw, lh);
    }
  }
  
  ctx.restore();
  ctx.shadowBlur = 0;
}

// ═══════════════════════════════════════════════════════════════
// CHAIN LIGHTNING RENDERING - BATCHED FOR PERFORMANCE! ⚡
// ═══════════════════════════════════════════════════════════════
export function drawChainLightning(state: GameState): void {
  const { ctx, chainLightningArcs, time, canvas } = state;
  if (!chainLightningArcs || chainLightningArcs.length === 0) return;
  
  const lw = state.viewport?.width ?? canvas.width;
  const lh = state.viewport?.height ?? canvas.height;
  
  ctx.save();
  
  // Pre-filter active arcs (life > 0 and has segments)
  const activeArcs = chainLightningArcs.filter(a => a.life > 0 && a.segments.length >= 2);
  if (activeArcs.length === 0) return;
  
  // Find max life for screen flash
  const maxLife = Math.max(...activeArcs.map(a => a.life));
  
  // ⚡ SCREEN FLASH on fresh lightning
  if (maxLife > 0.85) {
    const flashIntensity = (maxLife - 0.85) * 6;
    ctx.fillStyle = `rgba(255, 255, 255, ${flashIntensity * 0.15})`;
    ctx.fillRect(0, 0, lw, lh);
  }
  
  // Common settings
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowBlur = 0; // Disabled for performance
  
  // ═══════════════════════════════════════════════════════════════
  // LAYER 1: OUTER GLOW - BATCHED
  // ═══════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 12;
  ctx.globalAlpha = 0.25;
  ctx.beginPath();
  for (const arc of activeArcs) {
    ctx.moveTo(arc.segments[0].x, arc.segments[0].y);
    for (let i = 1; i < arc.segments.length; i++) {
      ctx.lineTo(arc.segments[i].x, arc.segments[i].y);
    }
  }
  ctx.stroke();
  
  // ═══════════════════════════════════════════════════════════════
  // LAYER 2: MID GLOW - BATCHED
  // ═══════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 6;
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  for (const arc of activeArcs) {
    ctx.moveTo(arc.segments[0].x, arc.segments[0].y);
    for (let i = 1; i < arc.segments.length; i++) {
      ctx.lineTo(arc.segments[i].x, arc.segments[i].y);
    }
  }
  ctx.stroke();
  
  // ═══════════════════════════════════════════════════════════════
  // LAYER 3: CORE (white-hot) - BATCHED
  // ═══════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.globalAlpha = 1;
  ctx.beginPath();
  for (const arc of activeArcs) {
    ctx.moveTo(arc.segments[0].x, arc.segments[0].y);
    for (let i = 1; i < arc.segments.length; i++) {
      ctx.lineTo(arc.segments[i].x, arc.segments[i].y);
    }
  }
  ctx.stroke();
  
  // ═══════════════════════════════════════════════════════════════
  // LAYER 4: BRANCHING FORKS - BATCHED
  // ═══════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  for (const arc of activeArcs) {
    const alpha = arc.life;
    for (let i = 1; i < arc.segments.length - 1; i += 2) {
      const seg = arc.segments[i];
      const forkAngle = Math.random() * Math.PI * 2;
      const forkLen = 8 + Math.random() * 15;
      const forkX = seg.x + Math.cos(forkAngle) * forkLen;
      const forkY = seg.y + Math.sin(forkAngle) * forkLen;
      ctx.moveTo(seg.x, seg.y);
      const midX = (seg.x + forkX) / 2 + (Math.random() - 0.5) * 8;
      const midY = (seg.y + forkY) / 2 + (Math.random() - 0.5) * 8;
      ctx.lineTo(midX, midY);
      ctx.lineTo(forkX, forkY);
    }
  }
  ctx.stroke();
  
  // ═══════════════════════════════════════════════════════════════
  // LAYER 5: SPARKS ALONG PATH - BATCHED
  // ═══════════════════════════════════════════════════════════════
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  for (const arc of activeArcs) {
    for (let i = 0; i < arc.segments.length; i++) {
      if (Math.sin(time * 40 + i * 3) > 0.3) {
        const seg = arc.segments[i];
        const sparkSize = (i === 0 || i === arc.segments.length - 1) ? 5 : 2.5;
        ctx.moveTo(seg.x + sparkSize, seg.y);
        ctx.arc(seg.x, seg.y, sparkSize * arc.life, 0, Math.PI * 2);
      }
    }
  }
  ctx.fill();
  
  // ═══════════════════════════════════════════════════════════════
  // LAYER 6: ENDPOINT SPARKS - BATCHED (colored outer + white core)
  // ═══════════════════════════════════════════════════════════════
  // Colored outer ring
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  for (const arc of activeArcs) {
    const endPt = arc.segments[arc.segments.length - 1];
    const size = 8 * arc.life;
    ctx.moveTo(endPt.x + size, endPt.y);
    ctx.arc(endPt.x, endPt.y, size, 0, Math.PI * 2);
  }
  ctx.fill();
  
  // White core
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 1;
  ctx.beginPath();
  for (const arc of activeArcs) {
    const endPt = arc.segments[arc.segments.length - 1];
    const size = 4 * arc.life;
    ctx.moveTo(endPt.x + size, endPt.y);
    ctx.arc(endPt.x, endPt.y, size, 0, Math.PI * 2);
  }
  ctx.fill();
  
  ctx.restore();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

export function drawEntities(state: GameState & { debug?: DebugFlags }): void {
  const { ctx, player, crystals, meteors, powerUpPickups, cats } = state;

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

    // Debug: player bounding boxes
    if (state.debug && state.debug.boxes) {
      ctx.save();
      ctx.lineWidth = 1;
      ctx.shadowBlur = 0;
      
      // Full bounding box (for reference, dimmed)
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
      ctx.strokeRect(player.x, player.y, player.width, player.height);
      
      // Actual collision hitbox (shrunk, bright)
      const topInset = config.PLAYER_HITBOX_TOP_INSET;
      const sideInset = config.PLAYER_HITBOX_SIDE_INSET;
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.9)';
      ctx.strokeRect(
        player.x + sideInset,
        player.y + topInset,
        player.width - sideInset * 2,
        player.height - topInset
      );
      
      ctx.restore();
    }
  }

  // Crystals
  const gameSpeedScale = state.dtFactor * state.modifiers.gameSpeed;
  const useOptimizedRendering = config.rainbowRain.CHAIN_LIGHTNING_USE_LARGE_PARTICLES;
  
  crystals.forEach((crystal) => {
    crystal.rotation += 0.1 * gameSpeedScale;
    ctx.save(); ctx.translate(crystal.x + crystal.width/2, crystal.y + crystal.height/2); ctx.rotate(crystal.rotation);
    let mainColor = crystal.type.colorHex || '#00ffff'; let shadowColor = mainColor;
    if (crystal.type.color === 'rainbow') { const hue = (state.time * 120 + crystal.hueOffset) % 360; mainColor = `hsl(${hue}, 100%, 60%)`; shadowColor = mainColor; }
    
    // PERFORMANCE: Disable shadowBlur during chain lightning chaos
    if (!useOptimizedRendering || state.crystals.length < 15) {
      ctx.shadowColor = shadowColor; 
      ctx.shadowBlur = 20 * crystal.glow;
    }
    
    ctx.fillStyle = mainColor; ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(8, 0); ctx.lineTo(0, 12); ctx.lineTo(-8, 0); ctx.closePath(); ctx.fill();
    let innerColor = '#ffffff'; if (crystal.type.color === 'rainbow') { const hueInner = (state.time * 120 + crystal.hueOffset + 45) % 360; innerColor = `hsl(${hueInner}, 100%, 70%)`; }
    ctx.fillStyle = innerColor; ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(4, 0); ctx.lineTo(0, 6); ctx.lineTo(-4, 0); ctx.closePath(); ctx.fill();
    ctx.restore(); ctx.shadowBlur = 0;

    // Debug: crystal bounding box (axis-aligned)
    if (state.debug && state.debug.boxes) {
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

  // Cats (bonus drops)
  cats.forEach((cat) => {
    const t = state.time;
    const cx = cat.x + cat.width / 2;
    const cy = cat.y + cat.height / 2;
    const bob = Math.sin(t * 4 + cat.wobble) * 2;
    const baseColor = cat.pattern === 'shadow' ? '#101018' : `hsl(${cat.hue}, 85%, 65%)`;
    const glowColor = cat.pattern === 'neon' ? `hsl(${(cat.hue + 40) % 360}, 100%, 70%)` : baseColor;

    ctx.save();
    ctx.translate(cx, cy + bob);
    
    // PERFORMANCE: Disable shadowBlur during chain lightning chaos
    if (!useOptimizedRendering || state.crystals.length < 15) {
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 16;
    }
    
    ctx.fillStyle = baseColor;

    // Face
    ctx.beginPath();
    ctx.arc(0, 0, cat.width * 0.45, 0, Math.PI * 2);
    ctx.fill();

    // Ears
    ctx.beginPath();
    ctx.moveTo(-cat.width * 0.35, -cat.height * 0.2);
    ctx.lineTo(-cat.width * 0.15, -cat.height * 0.55);
    ctx.lineTo(-cat.width * 0.02, -cat.height * 0.12);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cat.width * 0.35, -cat.height * 0.2);
    ctx.lineTo(cat.width * 0.15, -cat.height * 0.55);
    ctx.lineTo(cat.width * 0.02, -cat.height * 0.12);
    ctx.closePath();
    ctx.fill();

    // Subtle outline for contrast
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.beginPath();
    ctx.arc(0, 0, cat.width * 0.45, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-cat.width * 0.35, -cat.height * 0.2);
    ctx.lineTo(-cat.width * 0.15, -cat.height * 0.55);
    ctx.lineTo(-cat.width * 0.02, -cat.height * 0.12);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cat.width * 0.35, -cat.height * 0.2);
    ctx.lineTo(cat.width * 0.15, -cat.height * 0.55);
    ctx.lineTo(cat.width * 0.02, -cat.height * 0.12);
    ctx.closePath();
    ctx.stroke();

    // Eyes
    ctx.shadowBlur = 0;
    ctx.fillStyle = cat.pattern === 'shadow' ? '#00ffff' : '#0f1320';
    const eyeOffsetX = cat.width * 0.16;
    const eyeOffsetY = -cat.height * 0.05;
    ctx.beginPath();
    ctx.arc(-eyeOffsetX, eyeOffsetY, 1.6, 0, Math.PI * 2);
    ctx.arc(eyeOffsetX, eyeOffsetY, 1.6, 0, Math.PI * 2);
    ctx.fill();

    // Neon glasses (analogous hue)
    const glassesHue = cat.pattern === 'shadow' ? 200 : (cat.hue + 30) % 360;
    const glassesColor = `hsl(${glassesHue}, 100%, 70%)`;
    ctx.strokeStyle = glassesColor;
    ctx.shadowColor = glassesColor;
    ctx.shadowBlur = 8;
    ctx.lineWidth = 1.4;
    const lensW = cat.width * 0.18;
    const lensH = cat.height * 0.12;
    const lensY = eyeOffsetY - lensH * 0.2;
    ctx.beginPath();
    ctx.roundRect(-eyeOffsetX - lensW / 2, lensY, lensW, lensH, 2);
    ctx.roundRect(eyeOffsetX - lensW / 2, lensY, lensW, lensH, 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-eyeOffsetX + lensW / 2, lensY + lensH / 2);
    ctx.lineTo(eyeOffsetX - lensW / 2, lensY + lensH / 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Nose
    ctx.fillStyle = '#ff66cc';
    ctx.beginPath();
    ctx.arc(0, cat.height * 0.1, 1.6, 0, Math.PI * 2);
    ctx.fill();

    // Whiskers
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-cat.width * 0.1, cat.height * 0.08);
    ctx.lineTo(-cat.width * 0.35, cat.height * 0.05);
    ctx.moveTo(-cat.width * 0.1, cat.height * 0.14);
    ctx.lineTo(-cat.width * 0.35, cat.height * 0.18);
    ctx.moveTo(cat.width * 0.1, cat.height * 0.08);
    ctx.lineTo(cat.width * 0.35, cat.height * 0.05);
    ctx.moveTo(cat.width * 0.1, cat.height * 0.14);
    ctx.lineTo(cat.width * 0.35, cat.height * 0.18);
    ctx.stroke();

    // Pattern stripes
    if (cat.pattern === 'tabby') {
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, cat.width * 0.3, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    }

    ctx.restore();
    ctx.shadowBlur = 0;

    if (state.debug && state.debug.boxes) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1;
      ctx.strokeRect(cat.x, cat.y, cat.width, cat.height);
      ctx.restore();
    }
  });

  // Power-up pickups
  powerUpPickups.forEach((pickup) => {
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
    } else if (pickup.id === 'time_slow') {
      // Time Slow: Cyberpunk clock or hourglass
      const pulse = (Math.sin(t * 4) + 1) * 0.5;
      const style = pickup.timeSlowStyle || 'clock';
      
      ctx.save();
      ctx.translate(cx, cy);
      
      // ════════════════════════════════════════════════════════════
      // STYLE: CLOCK - Cyberpunk digital clock with spinning hands
      // ════════════════════════════════════════════════════════════
      if (style === 'clock') {
        const rotation = t * 0.5; // Slow rotation for the whole clock
        
        // Outer ring (neon purple)
        ctx.strokeStyle = '#c59bff';
        ctx.shadowColor = '#c59bff';
        ctx.shadowBlur = 12 + pulse * 8;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 11, 0, Math.PI * 2);
        ctx.stroke();
        
        // Inner ring (cyan accent)
        ctx.strokeStyle = '#7ce7ff';
        ctx.shadowColor = '#7ce7ff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.stroke();
        
        // Clock face fill
        ctx.fillStyle = 'rgba(197, 155, 255, 0.15)';
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // Hour markers (cyberpunk style - just 4 marks)
        ctx.strokeStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 6;
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 4; i++) {
          const angle = (i * Math.PI / 2) - Math.PI / 2;
          const innerR = 7;
          const outerR = 9;
          ctx.beginPath();
          ctx.moveTo(Math.cos(angle) * innerR, Math.sin(angle) * innerR);
          ctx.lineTo(Math.cos(angle) * outerR, Math.sin(angle) * outerR);
          ctx.stroke();
        }
        
        // Hour hand (slow, purple)
        const hourAngle = rotation - Math.PI / 2;
        ctx.strokeStyle = '#c59bff';
        ctx.shadowColor = '#c59bff';
        ctx.shadowBlur = 8;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(hourAngle) * 4, Math.sin(hourAngle) * 4);
        ctx.stroke();
        
        // Minute hand (fast, cyan)
        const minuteAngle = t * 3 - Math.PI / 2;
        ctx.strokeStyle = '#7ce7ff';
        ctx.shadowColor = '#7ce7ff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(minuteAngle) * 6, Math.sin(minuteAngle) * 6);
        ctx.stroke();
        
        // Center dot
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, 0, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Time particles orbiting
        for (let i = 0; i < 3; i++) {
          const pAngle = -t * 2 + (i * Math.PI * 2 / 3);
          const pRadius = 14 + pulse * 2;
          const px = Math.cos(pAngle) * pRadius;
          const py = Math.sin(pAngle) * pRadius;
          ctx.fillStyle = `rgba(197, 155, 255, ${0.5 + pulse * 0.5})`;
          ctx.shadowColor = '#c59bff';
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(px, py, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      
      // ════════════════════════════════════════════════════════════
      // STYLE: HOURGLASS - Neon hourglass with flowing sand particles
      // ════════════════════════════════════════════════════════════
      else if (style === 'hourglass') {
        const wobble = Math.sin(t * 2) * 0.08;
        ctx.rotate(wobble);
        
        // Hourglass frame (outer glow)
        ctx.strokeStyle = '#c59bff';
        ctx.shadowColor = '#c59bff';
        ctx.shadowBlur = 12 + pulse * 8;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Top triangle
        ctx.beginPath();
        ctx.moveTo(-8, -12);
        ctx.lineTo(8, -12);
        ctx.lineTo(0, -2);
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = 'rgba(197, 155, 255, 0.15)';
        ctx.fill();
        
        // Bottom triangle
        ctx.beginPath();
        ctx.moveTo(-8, 12);
        ctx.lineTo(8, 12);
        ctx.lineTo(0, 2);
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
        
        // Center connection (neck)
        ctx.strokeStyle = '#7ce7ff';
        ctx.shadowColor = '#7ce7ff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, -2);
        ctx.lineTo(0, 2);
        ctx.stroke();
        
        // Top and bottom caps
        ctx.strokeStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 8;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-9, -12);
        ctx.lineTo(9, -12);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-9, 12);
        ctx.lineTo(9, 12);
        ctx.stroke();
        
        // "Sand" particles falling through
        ctx.fillStyle = '#7ce7ff';
        ctx.shadowColor = '#7ce7ff';
        ctx.shadowBlur = 6;
        for (let i = 0; i < 4; i++) {
          const fallProgress = (t * 1.5 + i * 0.25) % 1;
          const py = -10 + fallProgress * 20;
          const spread = py > 0 ? (py / 12) * 4 : (1 + py / 10) * 3;
          const px = (Math.sin(t * 8 + i * 2) * spread) * (1 - Math.abs(py) / 12);
          const alpha = 1 - Math.abs(py) / 14;
          ctx.globalAlpha = alpha * 0.8;
          ctx.beginPath();
          ctx.arc(px, py, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        
        // Accumulated sand at bottom (animated fill)
        const sandLevel = 4 + Math.sin(t * 0.5) * 1;
        ctx.fillStyle = 'rgba(124, 231, 255, 0.4)';
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.moveTo(-6, 12);
        ctx.lineTo(6, 12);
        ctx.lineTo(0, 12 - sandLevel);
        ctx.closePath();
        ctx.fill();
        
        // Top sand (depleting)
        const topSandLevel = 4 - Math.sin(t * 0.5) * 1;
        ctx.fillStyle = 'rgba(197, 155, 255, 0.4)';
        ctx.beginPath();
        ctx.moveTo(-6, -12);
        ctx.lineTo(6, -12);
        ctx.lineTo(0, -12 + topSandLevel);
        ctx.closePath();
        ctx.fill();
      }
      
      ctx.restore();
      ctx.shadowBlur = 0;
    } else {
      // Other power-ups: hexagon style
      const palettes: Record<string, { stroke: string; fill: string; glyph: string }> = {
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

    if (state.debug && state.debug.boxes) {
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
  meteors.forEach((meteor) => {
    meteor.rotation += 0.05 * gameSpeedScale; meteor.pulse += 0.1 * gameSpeedScale;
    ctx.save(); ctx.translate(meteor.x + meteor.width/2, meteor.y + meteor.height/2); ctx.rotate(meteor.rotation);
    const glowIntensity = Math.sin(meteor.pulse) * 0.3 + 0.7; 
    
    // PERFORMANCE: Disable shadowBlur during chain lightning chaos
    if (!useOptimizedRendering || state.crystals.length < 15) {
      ctx.shadowColor = '#ff00ff'; 
      ctx.shadowBlur = 25 * glowIntensity;
    }
    
    ctx.fillStyle = '#ff00ff'; ctx.fillRect(-15, -15, 30, 30);
    ctx.fillStyle = '#ff6666'; ctx.fillRect(-8, -8, 16, 16);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-10, -10); ctx.lineTo(10, 10); ctx.moveTo(10, -10); ctx.lineTo(-10, 10); ctx.stroke();
    ctx.restore(); ctx.shadowBlur = 0;

    // Debug: meteor bounding box (axis-aligned)
    if (state.debug && state.debug.boxes) {
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

// ═══════════════════════════════════════════════════════════════
// RAINBOW RAIN EFFECT - Colorful overlay during rainbow rain event
// ═══════════════════════════════════════════════════════════════
export function drawRainbowRainEffect(state: GameState): void {
  if (!state.activeRainbowRain) return;

  const { ctx, canvas, time } = state;
  const lw = state.viewport?.width ?? canvas.width;
  const lh = state.viewport?.height ?? canvas.height;
  
  ctx.save();
  
  // Calculate progress through the event (0-1)
  const now = performance.now();
  const progress = Math.max(0, Math.min(1, (now - state.activeRainbowRain.startedAt) / config.rainbowRain.DURATION_MS));
  
  // Fade in and out effect
  let alpha = 0.15;
  if (progress < 0.1) {
    alpha = progress * 1.5; // Fade in
  } else if (progress > 0.9) {
    alpha = (1 - progress) * 1.5; // Fade out
  }
  
  // Create animated rainbow gradient overlay
  const gradient = ctx.createLinearGradient(0, 0, lw, 0);
  const hueOffset = (time * 0.05) % 360;
  
  // Rainbow colors with shifting hue
  gradient.addColorStop(0, `hsla(${(hueOffset + 0) % 360}, 100%, 50%, ${alpha})`);
  gradient.addColorStop(0.17, `hsla(${(hueOffset + 60) % 360}, 100%, 50%, ${alpha})`);
  gradient.addColorStop(0.33, `hsla(${(hueOffset + 120) % 360}, 100%, 50%, ${alpha})`);
  gradient.addColorStop(0.5, `hsla(${(hueOffset + 180) % 360}, 100%, 50%, ${alpha})`);
  gradient.addColorStop(0.67, `hsla(${(hueOffset + 240) % 360}, 100%, 50%, ${alpha})`);
  gradient.addColorStop(0.83, `hsla(${(hueOffset + 300) % 360}, 100%, 50%, ${alpha})`);
  gradient.addColorStop(1, `hsla(${(hueOffset + 360) % 360}, 100%, 50%, ${alpha})`);
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, lw, lh);
  
  // Add some sparkle effects
  const sparkleCount = 5;
  for (let i = 0; i < sparkleCount; i++) {
    const x = ((Math.sin(time * 0.001 + i * 1.2) + 1) * 0.5) * lw;
    const y = ((Math.cos(time * 0.0015 + i * 0.8) + 1) * 0.5) * lh;
    const sparkleAlpha = (Math.sin(time * 0.003 + i) + 1) * 0.5 * alpha * 2;
    
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${(hueOffset + i * 72) % 360}, 100%, 70%, ${sparkleAlpha})`;
    ctx.fill();
  }
  
  ctx.restore();
}
