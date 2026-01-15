import { GameState, DebugFlags } from '../types';

// ═══════════════════════════════════════════════════════════════
// STARFIELD BACKGROUND - Parallax stars, twinkle, shooting stars!
// ═══════════════════════════════════════════════════════════════

interface BackgroundStar {
  x: number;
  y: number;
  size: number;
  brightness: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  layer: number; // 0 = far (slow), 1 = mid, 2 = close (faster parallax)
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  length: number;
}

// Stars are generated once and cached
let cachedStars: BackgroundStar[] = [];
let cachedForDimensions = { w: 0, h: 0 };
let shootingStar: ShootingStar | null = null;
let nextShootingStarTime = 0;

// Cached gradients (regenerated on resize)
let cachedHorizonGradient: CanvasGradient | null = null;
let cachedVignetteGradient: CanvasGradient | null = null;

function generateStars(width: number, height: number): BackgroundStar[] {
  const stars: BackgroundStar[] = [];
  const starCount = Math.floor((width * height) / 700); // Slightly more stars
  
  for (let i = 0; i < starCount; i++) {
    // Layer distribution: 60% far, 30% mid, 10% close
    const layerRoll = Math.random();
    const layer = layerRoll < 0.6 ? 0 : layerRoll < 0.9 ? 1 : 2;
    
    // Size based on layer (closer = bigger)
    const baseSize = layer === 0 ? 0.4 + Math.random() * 0.6 
                   : layer === 1 ? 0.8 + Math.random() * 1.0 
                   : 1.5 + Math.random() * 1.5;
    
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: baseSize,
      brightness: 0.3 + Math.random() * 0.5 + layer * 0.15, // Closer = brighter
      twinkleSpeed: 0.5 + Math.random() * 2,
      twinkleOffset: Math.random() * Math.PI * 2,
      layer
    });
  }
  
  return stars;
}

export function drawGrid(state: GameState & { debug?: DebugFlags }) {
  const { ctx, canvas, time, dtFactor } = state;

  const lw = state.viewport?.width ?? canvas.width;
  const lh = state.viewport?.height ?? canvas.height;
  
  // Regenerate stars and gradients if canvas size changed
  if (cachedForDimensions.w !== lw || cachedForDimensions.h !== lh) {
    cachedStars = generateStars(lw, lh);
    cachedForDimensions = { w: lw, h: lh };
    nextShootingStarTime = time + 8 + Math.random() * 12; // First one in 8-20s
    
    // Cache gradients on resize (expensive to create every frame)
    cachedHorizonGradient = ctx.createLinearGradient(0, lh * 0.6, 0, lh);
    cachedHorizonGradient.addColorStop(0, 'rgba(20, 0, 40, 0)');
    cachedHorizonGradient.addColorStop(0.5, 'rgba(40, 10, 60, 0.15)');
    cachedHorizonGradient.addColorStop(1, 'rgba(60, 20, 80, 0.25)');
    
    cachedVignetteGradient = ctx.createRadialGradient(
      lw / 2, lh / 2, lh * 0.3,
      lw / 2, lh / 2, lh * 0.8
    );
    cachedVignetteGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    cachedVignetteGradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
  }
  
  // ═══════════════════════════════════════════════════════════════
  // 1. HORIZON GLOW - Subtle nebula at bottom (using cached gradient)
  // ═══════════════════════════════════════════════════════════════
  if (cachedHorizonGradient) {
    ctx.fillStyle = cachedHorizonGradient;
    ctx.fillRect(0, lh * 0.6, lw, lh * 0.4);
  }
  
  // ═══════════════════════════════════════════════════════════════
  // 2. PARALLAX STARS with subtle drift (scales gently with game speed)
  // ═══════════════════════════════════════════════════════════════
  // Speed multiplier: 1.0 at gameSpeed 2, up to 2.0 at gameSpeed 8, capped at 2.5
  const speedMultiplier = Math.min(2.5, 1 + (state.gameSpeed - 2) * 0.15);
  
  // Draw stars in two passes: non-glowing first, then glowing (reduces shadowBlur toggles)
  // Pass 1: All non-glowing stars (layers 0, 1, and most layer 2)
  ctx.shadowBlur = 0;
  const glowStarIndices: number[] = [];
  
  for (let i = 0; i < cachedStars.length; i++) {
    const star = cachedStars[i];
    
    // Parallax: closer stars drift slightly faster
    const baseDrift = star.layer === 0 ? 0.02 : star.layer === 1 ? 0.06 : 0.12;
    const driftSpeed = baseDrift * speedMultiplier;
    star.y += driftSpeed * dtFactor;
    
    // Wrap around when star goes off bottom
    if (star.y > lh + star.size) {
      star.y = -star.size;
      star.x = Math.random() * lw;
    }
    
    // Gentle twinkle
    const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.2 + 0.8;
    const alpha = star.brightness * twinkle;
    
    // Color tint based on offset
    const tint = star.twinkleOffset > 4 ? 'cyan' : star.twinkleOffset > 2 ? 'magenta' : 'white';
    
    if (tint === 'cyan') {
      ctx.fillStyle = `rgba(200, 255, 255, ${alpha})`;
    } else if (tint === 'magenta') {
      ctx.fillStyle = `rgba(255, 200, 255, ${alpha})`;
    } else {
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    }
    
    // Only glow every 4th close star (reduces GPU load significantly)
    const shouldGlow = star.layer === 2 && (i % 4 === 0);
    if (shouldGlow) {
      glowStarIndices.push(i);
      continue; // Draw in pass 2
    }
    
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Pass 2: Draw glowing stars with shadowBlur (batched to minimize state changes)
  if (glowStarIndices.length > 0) {
    ctx.shadowBlur = 4;
    for (const i of glowStarIndices) {
      const star = cachedStars[i];
      const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.2 + 0.8;
      const alpha = star.brightness * twinkle;
      const tint = star.twinkleOffset > 4 ? 'cyan' : star.twinkleOffset > 2 ? 'magenta' : 'white';
      
      if (tint === 'cyan') {
        ctx.fillStyle = `rgba(200, 255, 255, ${alpha})`;
      } else if (tint === 'magenta') {
        ctx.fillStyle = `rgba(255, 200, 255, ${alpha})`;
      } else {
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      }
      ctx.shadowColor = ctx.fillStyle as string;
      
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }
  
  // ═══════════════════════════════════════════════════════════════
  // 3. SHOOTING STAR - Rare and exciting!
  // ═══════════════════════════════════════════════════════════════
  if (!shootingStar && time > nextShootingStarTime) {
    // Spawn a new shooting star
    const startSide = Math.random() > 0.5; // Left or right
    shootingStar = {
      x: startSide ? -10 : lw + 10,
      y: Math.random() * lh * 0.4, // Upper portion of screen
      vx: startSide ? 8 + Math.random() * 6 : -(8 + Math.random() * 6),
      vy: 3 + Math.random() * 4,
      life: 1,
      length: 30 + Math.random() * 40
    };
    nextShootingStarTime = time + 12 + Math.random() * 18; // Next in 12-30s
  }
  
  if (shootingStar) {
    shootingStar.x += shootingStar.vx * dtFactor;
    shootingStar.y += shootingStar.vy * dtFactor;
    shootingStar.life -= 0.015 * dtFactor;
    
    if (shootingStar.life > 0 && shootingStar.x > -50 && shootingStar.x < lw + 50 && shootingStar.y < lh + 50) {
      const alpha = shootingStar.life;
      
      // Trail
      const tailX = shootingStar.x - (shootingStar.vx / Math.hypot(shootingStar.vx, shootingStar.vy)) * shootingStar.length;
      const tailY = shootingStar.y - (shootingStar.vy / Math.hypot(shootingStar.vx, shootingStar.vy)) * shootingStar.length;
      
      const trailGradient = ctx.createLinearGradient(tailX, tailY, shootingStar.x, shootingStar.y);
      trailGradient.addColorStop(0, `rgba(255, 255, 255, 0)`);
      trailGradient.addColorStop(1, `rgba(255, 255, 255, ${alpha})`);
      
      ctx.strokeStyle = trailGradient;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(shootingStar.x, shootingStar.y);
      ctx.stroke();
      
      // Bright head
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(shootingStar.x, shootingStar.y, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      shootingStar = null;
    }
  }
  
  // ═══════════════════════════════════════════════════════════════
  // 4. VIGNETTE - Subtle darkening at edges (using cached gradient)
  // ═══════════════════════════════════════════════════════════════
  if (cachedVignetteGradient) {
    ctx.fillStyle = cachedVignetteGradient;
    ctx.fillRect(0, 0, lw, lh);
  }
}
