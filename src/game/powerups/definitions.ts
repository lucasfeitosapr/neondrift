import { config } from '../config';
import { ChainLightningArc, Crystal, CrystalColor, GameState, Particle, PowerUpDefinition, PowerUpId } from '../types';

// ═══════════════════════════════════════════════════════════════
// PARTICLE HELPER - Spawn particles directly from power-ups
// ═══════════════════════════════════════════════════════════════
function spawnParticleBurst(state: GameState, x: number, y: number, colorRgb: string, count = 12, isRainbow = false) {
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
    p.decay = 0.035 + Math.random() * 0.02;
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
    maxStacks: 3, // At max stacks, triggers SUPER MAGNET mode!
    applyModifiers: (mods, _state, instance) => {
      // ═══════════════════════════════════════════════════════════
      // PROGRESSIVE MAGNET TIERS
      // Tier 1 (1 stack): Range 180, gentle pull
      // Tier 2 (2 stacks): Range 280, strong pull
      // Tier 3 (3 stacks): Range INFINITE, SUPER MAGNET!
      // ═══════════════════════════════════════════════════════════
      mods.magnetPullTier = instance.stacks;
      
      if (instance.stacks >= 3) {
        // TIER 3: SUPER MAGNET - everything on screen rushes to you!
        mods.magnetRange = 9999;
        mods.superMagnet = true;
      } else if (instance.stacks === 2) {
        // TIER 2: Strong pull, bigger range
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
    onActivate: (state, instance, _now) => {
      // Trigger visual feedback when hitting max stacks
      if (instance.stacks >= 3) {
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
    durationMs: 4500,
    stacking: 'refresh',
    applyModifiers: (mods) => {
      mods.gameSpeed *= 0.6;
      mods.spawnRateCrystal *= 0.8;
      mods.spawnRateMeteor *= 0.8;
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
      state.floatingTexts.push({ 
        x: playerX, y: state.player.y - 30, 
        text: `⚡ ${colorName} CHAIN x${sortedCrystals.length} ⚡`, 
        life: 1.5, color: colorHex, vy: -0.5 
      });
    }
  }
};

export function getPowerUpDefinition(id: PowerUpId): PowerUpDefinition | undefined {
  return powerUpRegistry[id];
}
