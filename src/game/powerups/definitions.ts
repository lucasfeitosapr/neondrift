import { config } from '../config';
import { ChainLightningArc, Crystal, CrystalColor, GameState, Particle, PowerUpDefinition, PowerUpId } from '../types';

// ═══════════════════════════════════════════════════════════════
// PARTICLE HELPER - Spawn particles directly from power-ups
// ═══════════════════════════════════════════════════════════════
function spawnParticleBurst(state: GameState, x: number, y: number, colorRgb: string, count = 12, isRainbow = false, decay?: number) {
  const baseDecay = decay ?? config.particles.DECAY_CRYSTAL_CHAIN;
  
  for (let i = 0; i < count; i++) {
    const p: Particle = state.particlePool.borrow();
    p.active = true;
    p.x = x;
    p.y = y;
    // Explosive radial burst
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
    const speed = 4 + Math.random() * 6;
    p.vx = Math.cos(angle) * speed;
    p.vy = Math.sin(angle) * speed;
    p.life = 1;
    p.decay = baseDecay + Math.random() * 0.01; // slight variation
    p.size = 2 + Math.random() * 3;
    
    if (isRainbow) {
      p.colorType = 'rainbow';
      p.hueOffset = Math.random() * 360;
      p.color = null;
    } else {
      p.colorType = 'rgb';
      p.color = colorRgb;
      p.hueOffset = 0;
    }
    
    state.particles.push(p);
  }
}

// ═══════════════════════════════════════════════════════════════
// CHAIN LIGHTNING HELPERS
// ═══════════════════════════════════════════════════════════════

/** Find the most common crystal color on screen */
function getMostCommonColor(crystals: Crystal[]): CrystalColor | null {
  if (crystals.length === 0) return null;
  
  const counts: Record<CrystalColor, number> = { cyan: 0, purple: 0, gold: 0, rainbow: 0 };
  for (const c of crystals) {
    counts[c.type.color]++;
  }
  
  let maxColor: CrystalColor | null = null;
  let maxCount = 0;
  for (const [color, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      maxColor = color as CrystalColor;
    }
  }
  return maxColor;
}

/** Generate a jagged lightning path between two points */
function generateLightningSegments(
  fromX: number, fromY: number, toX: number, toY: number, segments = 12
): { x: number; y: number }[] {
  const path: { x: number; y: number }[] = [{ x: fromX, y: fromY }];
  const dx = toX - fromX;
  const dy = toY - fromY;
  const dist = Math.hypot(dx, dy);
  
  // More segments for longer arcs
  const numSegments = Math.max(segments, Math.floor(dist / 20));
  
  for (let i = 1; i < numSegments; i++) {
    const t = i / numSegments;
    const baseX = fromX + dx * t;
    const baseY = fromY + dy * t;
    // BIGGER jitter for more dramatic lightning!
    const jitterScale = 25 + Math.random() * 25; // 25-50px jitter
    const jitter = (Math.random() - 0.5) * 2 * jitterScale;
    const perpX = -dy / Math.max(1, dist) * jitter;
    const perpY = dx / Math.max(1, dist) * jitter;
    path.push({ x: baseX + perpX, y: baseY + perpY });
  }
  path.push({ x: toX, y: toY });
  return path;
}

/** Check if a point is within distance of a line segment */
function pointToSegmentDistance(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSq = dx * dx + dy * dy;
  
  if (lengthSq === 0) return Math.hypot(px - x1, py - y1);
  
  // Project point onto line, clamped to segment
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSq));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  
  return Math.hypot(px - projX, py - projY);
}

/** Check if a meteor is hit by any arc segment */
function isMeteorHitByArcs(
  meteor: { x: number; y: number; width: number; height: number },
  arcs: ChainLightningArc[],
  hitRadius = 35 // How close the lightning needs to be to hit
): boolean {
  const mx = meteor.x + meteor.width / 2;
  const my = meteor.y + meteor.height / 2;
  
  for (const arc of arcs) {
    // Check each segment of the arc
    for (let i = 0; i < arc.segments.length - 1; i++) {
      const s1 = arc.segments[i];
      const s2 = arc.segments[i + 1];
      const dist = pointToSegmentDistance(mx, my, s1.x, s1.y, s2.x, s2.y);
      if (dist < hitRadius) return true;
    }
  }
  return false;
}

/** Sort crystals for chaining (nearest-neighbor chain from player) */
function sortCrystalsForChain(crystals: Crystal[], playerX: number, playerY: number): Crystal[] {
  if (crystals.length === 0) return [];
  
  const sorted: Crystal[] = [];
  const remaining = [...crystals];
  
  // Start from player position
  let currentX = playerX;
  let currentY = playerY;
  
  while (remaining.length > 0) {
    let nearestIdx = 0;
    let nearestDist = Infinity;
    
    for (let i = 0; i < remaining.length; i++) {
      const c = remaining[i];
      const cx = c.x + c.width / 2;
      const cy = c.y + c.height / 2;
      const dist = Math.hypot(cx - currentX, cy - currentY);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIdx = i;
      }
    }
    
    const nearest = remaining.splice(nearestIdx, 1)[0];
    sorted.push(nearest);
    currentX = nearest.x + nearest.width / 2;
    currentY = nearest.y + nearest.height / 2;
  }
  
  return sorted;
}

export const powerUpRegistry: Record<PowerUpId, PowerUpDefinition> = {
  magnet: {
    id: 'magnet',
    displayName: 'Magnet',
    kind: 'buff',
    durationMs: 12000, // 12 seconds - enough time to stack 3!
    // Feature flag: 'extend' adds duration, 'stack' resets timer but keeps stacks
    get stacking() {
      return config.features.MAGNET_STACKS_DURATION ? 'extend' : 'stack';
    },
    get maxStacks() {
      return config.magnet.MAX_STACKS;
    },
    applyModifiers: (mods, _state, instance) => {
      // ═══════════════════════════════════════════════════════════
      // PROGRESSIVE MAGNET TIERS
      // Tier 1 (1 stack): Range 180, gentle pull
      // Tier 2+ (2+ stacks): Range 280, strong pull
      // Super Magnet threshold: Range INFINITE, SUPER MAGNET!
      // ═══════════════════════════════════════════════════════════
      const superMagnetThreshold = config.magnet.SUPER_MAGNET_THRESHOLD;
      mods.magnetPullTier = instance.stacks;
      
      if (instance.stacks >= superMagnetThreshold) {
        // SUPER MAGNET - everything on screen rushes to you!
        mods.magnetRange = 9999;
        mods.superMagnet = true;
      } else if (instance.stacks >= 2) {
        // TIER 2+: Strong pull, bigger range
        mods.magnetRange = Math.max(mods.magnetRange, 280);
      } else {
        // TIER 1: Normal pull, base range
        mods.magnetRange = Math.max(mods.magnetRange, 180);
      }
      
      // Feature: reduce magnet spawn rate based on active stacks
      if (config.features.MAGNET_DIMINISHING_SPAWNS) {
        const reduction = Math.pow(config.features.MAGNET_SPAWN_REDUCTION_PER_STACK, instance.stacks);
        mods.spawnRateMagnet = (mods.spawnRateMagnet ?? 1) * reduction;
      }
    },
    onActivate: (state, instance) => {
      // Trigger visual feedback when hitting super magnet threshold
      if (instance.stacks >= config.magnet.SUPER_MAGNET_THRESHOLD) {
        const x = state.player ? state.player.x + state.player.width / 2 : state.canvas.width / 2;
        const y = state.player ? state.player.y - 20 : 50;
        state.floatingTexts.push({ x, y, text: '⚡ SUPER MAGNET ⚡', life: 1.5, color: '#ff6644', vy: -0.5 });
      }
    }
  },
  time_slow: {
    id: 'time_slow',
    displayName: 'Time Slow',
    kind: 'buff',
    get durationMs() {
      return config.timeSlow.DURATION_MS;
    },
    stacking: 'refresh',
    applyModifiers: (mods) => {
      mods.gameSpeed *= config.timeSlow.SPEED_MULTIPLIER;
      mods.spawnRateCrystal *= config.timeSlow.SPAWN_RATE_CRYSTAL;
      mods.spawnRateMeteor *= config.timeSlow.SPAWN_RATE_METEOR;
    },
    onActivate: (state, instance, now) => {
      if (!state.player) return;
      
      const playerX = state.player.x + state.player.width / 2;
      const playerY = state.player.y + state.player.height / 2;
      
      // ═══════════════════════════════════════════════════════════════
      // REVENGE TRACKING - Store starting score to count crystals later
      // ═══════════════════════════════════════════════════════════════
      if (!instance.data) instance.data = {};
      instance.data.startScore = state.score;
      instance.data.startCrystalCount = state.crystals.length;
      
      // Show activation text
      state.floatingTexts.push({
        x: playerX,
        y: state.player.y - 30,
        text: '⏱ SLOW MOTION ⏱',
        life: 1.5,
        color: '#c59bff',
        vy: -0.5
      });
      
      // Spawn ripple effect if enabled
      if (config.timeSlow.EFFECT_RIPPLE) {
        state.timeSlowRipples.push({
          x: playerX,
          y: playerY,
          startTime: now,
          maxRadius: config.timeSlow.RIPPLE_MAX_RADIUS,
          durationMs: config.timeSlow.RIPPLE_DURATION_MS
        });
      }
      
      // Particle burst (purple/cyan time particles)
      spawnParticleBurst(state, playerX, playerY, '197, 155, 255', 16, false, 0.025);
    },
    onExpire: (state, instance, now) => {
      if (!state.player) return;
      
      const revenge = config.timeSlow.revenge;
      if (!revenge.ENABLED) return;
      
      // ═══════════════════════════════════════════════════════════════
      // REVENGE CALCULATION - The price of manipulating time! 😈
      // ═══════════════════════════════════════════════════════════════
      const startScore = instance.data?.startScore ?? state.score;
      const scoreGained = state.score - startScore;
      
      // Estimate crystals collected (rough: 10-50 points per crystal)
      // Using average of ~20 points per crystal as approximation
      const estimatedCrystals = Math.floor(scoreGained / 20);
      
      // Calculate revenge chance
      const chance = Math.min(
        revenge.MAX_CHANCE,
        revenge.BASE_CHANCE + (estimatedCrystals * revenge.CHANCE_PER_CRYSTAL)
      );
      
      // Roll the dice!
      const roll = Math.random();
      if (roll > chance) {
        // Lucky escape!
        return;
      }
      
      // ═══════════════════════════════════════════════════════════════
      // REVENGE TRIGGERED - Queue the meteor!
      // ═══════════════════════════════════════════════════════════════
      const playerX = state.player.x + state.player.width / 2;
      const playerY = state.player.y + state.player.height / 2;
      
      // Calculate random speed within range
      const speed = revenge.SPEED_MIN + Math.random() * (revenge.SPEED_MAX - revenge.SPEED_MIN);
      
      // Queue the revenge meteor with delay
      state.pendingRevengeMeteors.push({
        spawnAt: now + revenge.DELAY_MS,
        targetX: playerX,
        targetY: playerY,
        speed: speed,
        warningShown: false
      });
      
      // Ominous message (optional - player might not notice in time!)
      state.floatingTexts.push({
        x: playerX,
        y: state.player.y - 40,
        text: '⚠️ TIME DEBT ⚠️',
        life: 0.8,
        color: revenge.WARNING_COLOR,
        vy: -0.6
      });
    }
  },
  chain_lightning: {
    id: 'chain_lightning',
    displayName: 'Chain Lightning',
    kind: 'instant',
    stacking: 'parallel',
    onActivate: (state, _instance, now) => {
      if (!state.player) return;
      
      const playerX = state.player.x + state.player.width / 2;
      const playerY = state.player.y + state.player.height / 2;
      
      // Find the most common color on screen
      const targetColor = getMostCommonColor(state.crystals);
      if (!targetColor) {
        // No crystals - show feedback
        state.floatingTexts.push({ 
          x: playerX, y: state.player.y - 20, 
          text: 'NO CRYSTALS!', life: 1, color: '#ff6666', vy: -0.4 
        });
        return;
      }
      
      // Filter crystals by target color
      const matchingCrystals = state.crystals.filter(c => c.type.color === targetColor);
      if (matchingCrystals.length === 0) return;
      
      // Sort by nearest-neighbor for nice chain effect
      const sortedCrystals = sortCrystalsForChain(matchingCrystals, playerX, playerY);
      
      // Get color hex for visuals
      const colorHex = sortedCrystals[0].type.colorHex || '#00ffff';
      
      // Create lightning arcs from player to first crystal, then between crystals
      const arcs: ChainLightningArc[] = [];
      
      // Arc from player to first crystal
      const first = sortedCrystals[0];
      arcs.push({
        fromX: playerX,
        fromY: playerY,
        toX: first.x + first.width / 2,
        toY: first.y + first.height / 2,
        life: 1,
        color: colorHex,
        segments: generateLightningSegments(
          playerX, playerY,
          first.x + first.width / 2, first.y + first.height / 2
        )
      });
      
      // Arcs between subsequent crystals
      for (let i = 0; i < sortedCrystals.length - 1; i++) {
        const from = sortedCrystals[i];
        const to = sortedCrystals[i + 1];
        const fx = from.x + from.width / 2;
        const fy = from.y + from.height / 2;
        const tx = to.x + to.width / 2;
        const ty = to.y + to.height / 2;
        
        arcs.push({
          fromX: fx, fromY: fy,
          toX: tx, toY: ty,
          life: 1,
          color: colorHex,
          segments: generateLightningSegments(fx, fy, tx, ty)
        });
      }
      
      // Add all arcs to state
      state.chainLightningArcs.push(...arcs);
      
      // ⚡ DESTROY METEORS caught in the lightning path! ⚡
      let meteorsDestroyed = 0;
      for (let i = state.meteors.length - 1; i >= 0; i--) {
        const meteor = state.meteors[i];
        if (isMeteorHitByArcs(meteor, arcs)) {
          const mx = meteor.x + meteor.width / 2;
          const my = meteor.y + meteor.height / 2;
          
          // Particle explosion (magenta for meteors) - longer decay for dramatic effect
          spawnParticleBurst(state, mx, my, '255, 0, 255', 16, false, config.particles.DECAY_METEOR_ZAP);
          
          // Floating text
          state.floatingTexts.push({
            x: mx,
            y: my - 10,
            text: '💥 ZAP!',
            life: 0.8,
            color: '#ff00ff',
            vy: -0.5
          });
          
          // Remove meteor
          state.meteors.splice(i, 1);
          meteorsDestroyed++;
        }
      }
      
      // Award points and remove crystals - show floating text at EACH crystal!
      let totalPoints = 0;
      const chainBonus = 1 + (sortedCrystals.length - 1) * 0.25; // +25% per crystal in chain
      
      for (let i = 0; i < sortedCrystals.length; i++) {
        const crystal = sortedCrystals[i];
        const points = Math.floor(crystal.type.points * chainBonus * state.modifiers.scoreMultiplier);
        totalPoints += points;
        
        // Show points at the crystal's position!
        const cx = crystal.x + crystal.width / 2;
        const cy = crystal.y + crystal.height / 2;
        state.floatingTexts.push({
          x: cx, 
          y: cy - 10,
          text: `+${points}`,
          life: 1.0 + i * 0.1, // Stagger life so they cascade nicely
          color: colorHex,
          vy: -0.4 - Math.random() * 0.2
        });
        
        // ⚡ PARTICLE EXPLOSION at each crystal! ⚡
        const isRainbow = crystal.type.color === 'rainbow';
        spawnParticleBurst(state, cx, cy, crystal.type.colorRgb, 14, isRainbow);
        
        // Remove from crystals array
        const idx = state.crystals.indexOf(crystal);
        if (idx >= 0) state.crystals.splice(idx, 1);
      }
      
      state.score += totalPoints;
      state.lastCollectTimestamp = now;
      state.comboCount = Math.min(config.MAX_COMBO, state.comboCount + sortedCrystals.length);
      
      // Header text at player showing chain summary
      const colorName = targetColor.toUpperCase();
      const meteorText = meteorsDestroyed > 0 ? ` +${meteorsDestroyed}💥` : '';
      state.floatingTexts.push({ 
        x: playerX, y: state.player.y - 30, 
        text: `⚡ ${colorName} CHAIN x${sortedCrystals.length}${meteorText} ⚡`, 
        life: 1.5, color: colorHex, vy: -0.5 
      });
    }
  }
};

export function getPowerUpDefinition(id: PowerUpId): PowerUpDefinition | undefined {
  return powerUpRegistry[id];
}
