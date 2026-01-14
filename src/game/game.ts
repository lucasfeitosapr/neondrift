import { config } from './config';
import { initInput, keys } from './input';
import { renderScene } from './renderer';
import { spawnCrystal, spawnMeteor, spawnRevengeMeteor } from './spawner';
import { GameState, Particle, ParticleColorMode } from './types';
import { createState, defaultModifiers } from './state';
import { activatePowerUp, tickPowerUps } from './powerups/system';
import { spawnPowerUpPickup, updatePowerUpPickups } from './powerups/pickups';

export function startGame(): void {
  // ...existing code migrated from neon_drift.html script section...
  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  const scoreElement = document.getElementById('score') as HTMLElement;
  const highScoreElement = document.getElementById('highScore') as HTMLElement;

  // Helpers to read logical (CSS) canvas size when DPR scaling is applied
  function logicalWidth() { return (canvas as any)._cssWidth || canvas.width; }
  function logicalHeight() { return (canvas as any)._cssHeight || canvas.height; }

  // Create single shared game state (use typed GameState)
  const state: GameState = createState(canvas, ctx);

  // update UI highscore text
  highScoreElement.textContent = `H I G H : ${state.highScore.toString().padStart(6, '0')}`;

  // Telemetry removed (was experimental)

  // Floating score texts
  function createFloatingText(x: number, y: number, text: string, color = '#00ffff') {
    state.floatingTexts.push({ x, y, text, life: 1, color, vy: -0.3 - Math.random() * 0.4 });
  }

  // Initialize grid
  for (let i = 0; i < 20; i++) {
    state.gridLines.push({ y: i * 30, opacity: Math.random() * 0.5 + 0.1 });
  }

  // Input handling
  initInput(state);

  // Responsive DPR-aware resize handler: set CSS size and high-DPI backing buffer
  function resizeCanvas() {
    const padding = 40;
    // Mobile-friendly sizing: fit canvas to available space
    const availableWidth = window.innerWidth - padding;
    const availableHeight = window.innerHeight - 180; // Leave room for title/controls
    
    // Maintain aspect ratio (400:500 = 0.8)
    const targetAspect = 0.8;
    let cssWidth = Math.min(400, availableWidth); // Max 400px, or screen width
    let cssHeight = cssWidth / targetAspect;
    
    // If height is too tall, constrain by height instead
    if (cssHeight > availableHeight) {
      cssHeight = availableHeight;
      cssWidth = cssHeight * targetAspect;
    }
    
    // Minimum sizes for playability
    cssWidth = Math.max(280, cssWidth);
    cssHeight = Math.max(350, cssHeight);
    
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    (canvas as any)._cssWidth = cssWidth;
    (canvas as any)._cssHeight = cssHeight;
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
    canvas.width = Math.max(1, Math.floor(cssWidth * dpr));
    canvas.height = Math.max(1, Math.floor(cssHeight * dpr));

    try { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); } catch (e) { }

    if (state.player) {
      state.player.x = Math.floor(logicalWidth() / 2 - state.player.width / 2);
      // Keep player in vertical bounds if vertical movement is enabled
      if (config.ENABLE_VERTICAL_MOVEMENT) {
        const lh = logicalHeight();
        const bottomBound = lh - config.PLAYER_VERTICAL_PADDING - state.player.height;
        state.player.y = Math.min(state.player.y, bottomBound);
        state.player.y = Math.max(state.player.y, config.PLAYER_VERTICAL_PADDING);
      } else {
        state.player.y = logicalHeight() - 60;
      }
    }
  }

  // spawn / particle helpers using state
  function spawnParticleFromPool(x: number, y: number, vx: number, vy: number, life: number, decay: number, size: number, color: string | null, colorType: ParticleColorMode, hueOffset?: number) {
    const p: Particle = state.particlePool.borrow();
    p.active = true;
    p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.life = life; p.decay = decay; p.size = size;
    if (colorType === 'rainbow') { p.colorType = 'rainbow'; p.hueOffset = hueOffset || 0; p.color = null; }
    else { p.colorType = 'rgb'; p.color = color; p.hueOffset = 0; }
    state.particles.push(p);
    return p;
  }

  function createParticle(x: number, y: number, color: string | 'rainbow', customDecay?: number) {
    if (color === 'rainbow') {
      const decay = customDecay ?? config.particles.DECAY_RAINBOW;
      for (let i = 0; i < 16; i++) {
        const vx = (Math.random() - 0.5) * 8;
        const vy = (Math.random() - 0.5) * 8;
        spawnParticleFromPool(x, y, vx, vy, 1, decay, Math.random() * 4 + 1.5, null, 'rainbow', Math.random() * 360);
      }
    } else {
      const decay = customDecay ?? config.particles.DECAY_NORMAL;
      for (let i = 0; i < 10; i++) {
        const vx = (Math.random() - 0.5) * 6;
        const vy = (Math.random() - 0.5) * 6;
        spawnParticleFromPool(x, y, vx, vy, 1, decay, Math.random() * 3 + 1.5, color as string, 'rgb', 0);
      }
    }
  }

  // drawing logic moved to src/game/render/* via renderer

  function checkCollision(obj1: { x: number; y: number; width: number; height: number; }, obj2: { x: number; y: number; width: number; height: number; }) {
    return obj1.x < obj2.x + obj2.width && obj1.x + obj1.width > obj2.x && obj1.y < obj2.y + obj2.height && obj1.y + obj1.height > obj2.y;
  }
  
  // Player hitbox collision - uses shrunk hitbox to match triangle shape
  function checkPlayerCollision(player: { x: number; y: number; width: number; height: number; }, obj: { x: number; y: number; width: number; height: number; }) {
    const topInset = config.PLAYER_HITBOX_TOP_INSET;
    const sideInset = config.PLAYER_HITBOX_SIDE_INSET;
    
    // Shrunk player hitbox
    const px = player.x + sideInset;
    const py = player.y + topInset;
    const pw = player.width - sideInset * 2;
    const ph = player.height - topInset;
    
    return px < obj.x + obj.width && px + pw > obj.x && py < obj.y + obj.height && py + ph > obj.y;
  }

  function update() {
    if (!state.gameRunning) return;
    const now = performance.now();
    const dtMs = state.dtFactor * (1000 / 60);
    tickPowerUps(state, now, dtMs);
    
    // Decay chain lightning arcs
    for (let i = state.chainLightningArcs.length - 1; i >= 0; i--) {
      state.chainLightningArcs[i].life -= 0.03 * state.dtFactor;
      if (state.chainLightningArcs[i].life <= 0) {
        state.chainLightningArcs.splice(i, 1);
      }
    }
    
    // Decay time slow ripples
    for (let i = state.timeSlowRipples.length - 1; i >= 0; i--) {
      const ripple = state.timeSlowRipples[i];
      if (now - ripple.startTime >= ripple.durationMs) {
        state.timeSlowRipples.splice(i, 1);
      }
    }
    
    // ═══════════════════════════════════════════════════════════════
    // PROCESS PENDING REVENGE METEORS - Time to pay the debt! 😈
    // ═══════════════════════════════════════════════════════════════
    for (let i = state.pendingRevengeMeteors.length - 1; i >= 0; i--) {
      const pending = state.pendingRevengeMeteors[i];
      
      // Show warning flash shortly before spawn
      if (!pending.warningShown && config.timeSlow.revenge.WARNING_FLASH) {
        const timeUntilSpawn = pending.spawnAt - now;
        if (timeUntilSpawn <= 200) { // Flash 200ms before spawn
          pending.warningShown = true;
          // The warning will be rendered by the render system
        }
      }
      
      // Time to spawn!
      if (now >= pending.spawnAt) {
        spawnRevengeMeteor(state, pending.targetX, pending.targetY, pending.speed);
        state.pendingRevengeMeteors.splice(i, 1);
      }
    }

    const moveAmount = state.player.speed * state.dtFactor * state.modifiers.playerSpeed;
    const lw = logicalWidth();
    const lh = logicalHeight();
    
    // Horizontal movement
    if ((keys['arrowleft'] || keys['a']) && state.player.x > 0) { state.player.x -= moveAmount; if (state.player.x < 0) state.player.x = 0; }
    if ((keys['arrowright'] || keys['d']) && state.player.x < lw - state.player.width) { state.player.x += moveAmount; if (state.player.x > lw - state.player.width) state.player.x = lw - state.player.width; }
    
    // Vertical movement (if enabled)
    if (config.ENABLE_VERTICAL_MOVEMENT) {
      const topBound = config.PLAYER_VERTICAL_PADDING;
      const bottomBound = lh - config.PLAYER_VERTICAL_PADDING - state.player.height;
      
      if ((keys['arrowup'] || keys['w']) && state.player.y > topBound) {
        state.player.y -= moveAmount;
        if (state.player.y < topBound) state.player.y = topBound;
      }
      if ((keys['arrowdown'] || keys['s']) && state.player.y < bottomBound) {
        state.player.y += moveAmount;
        if (state.player.y > bottomBound) state.player.y = bottomBound;
      }
    }

    // Update power-up pickups (falling, collectable)
    updatePowerUpPickups(
      state,
      lw,
      logicalHeight(),
      state.dtFactor,
      (id) => {
        activatePowerUp(state, id, now);
        createFloatingText(state.player.x + state.player.width/2, state.player.y - 28, id === 'magnet' ? 'MAGNET ON' : id.toUpperCase(), '#7ce7ff');
      }
    );

    for (let i = state.crystals.length - 1; i >= 0; i--) {
      const crystal = state.crystals[i];

      if (state.modifiers.magnetRange > 0 && state.player) {
        // Only pull crystals that are VISIBLE on screen (y > 0)
        // This makes it feel better - you see the crystal first, then it gets pulled!
        const isOnScreen = crystal.y > 0;
        
        if (isOnScreen) {
          const cx = crystal.x + crystal.width / 2;
          const cy = crystal.y + crystal.height / 2;
          const px = state.player.x + state.player.width / 2;
          const py = state.player.y + state.player.height / 2;
          const dx = px - cx;
          const dy = py - cy;
          const dist = Math.hypot(dx, dy);
          
          if (dist > 0 && dist < state.modifiers.magnetRange) {
            const nx = dx / dist;
            const ny = dy / dist;
            
            // ═══════════════════════════════════════════════════════════
            // PROGRESSIVE MAGNET TIERS (based on magnetPullTier modifier)
            // Tier 1: Gentle pull, distance falloff
            // Tier 2: Stronger pull, less falloff  
            // Tier 3: SUPER MAGNET - crystals rush at you!
            // ═══════════════════════════════════════════════════════════
            const tier = state.modifiers.magnetPullTier || 1;
            
            if (tier >= 3) {
              // TIER 3: SUPER MAGNET - crystals zoom toward player!
              const superPull = config.MAGNET_PULL_STRENGTH * 3;
              crystal.x += nx * superPull * state.dtFactor;
              crystal.y += ny * superPull * state.dtFactor;
              crystal.speed = 0; // Stop falling, home in on player
            } else if (tier === 2) {
              // TIER 2: Strong pull, reduced falloff
              const pull = (0.5 + 0.5 * (1 - dist / state.modifiers.magnetRange)) * config.MAGNET_PULL_STRENGTH * 1.8;
              crystal.x += nx * pull * state.dtFactor;
              crystal.y += ny * pull * state.dtFactor;
            } else {
              // TIER 1: Normal magnet pull (distance-based falloff)
              const pull = (1 - dist / state.modifiers.magnetRange) * config.MAGNET_PULL_STRENGTH;
              crystal.x += nx * pull * state.dtFactor;
              crystal.y += ny * pull * state.dtFactor;
            }
          }
        }
      }

      crystal.y += crystal.speed * state.dtFactor * state.modifiers.gameSpeed;
      crystal.glow = Math.sin(state.time * 3) * 0.3 + 0.7;
      if (checkCollision(state.player, crystal)) {
        if (now - state.lastCollectTimestamp <= config.COMBO_TIMEOUT) { state.comboCount = Math.min(config.MAX_COMBO, state.comboCount + 1); } else { state.comboCount = 1; }
        state.lastCollectTimestamp = now;
        const multiplier = 1 + Math.max(0, state.comboCount - 1) * 0.5;
        const basePoints = crystal.type.points;
        const pointsAwarded = Math.floor(basePoints * multiplier * state.modifiers.scoreMultiplier);
        state.score += pointsAwarded;

        let particleColor: any;
        switch(crystal.type.color) { case 'purple': particleColor = '170, 0, 255'; break; case 'gold': particleColor = '255, 170, 0'; break; case 'rainbow': particleColor = 'rainbow'; break; default: particleColor = '0, 255, 255'; }
        createParticle(crystal.x + crystal.width/2, crystal.y + crystal.height/2, particleColor);
        createFloatingText(crystal.x + crystal.width/2, crystal.y, `+${pointsAwarded}`, '#00ffff');
        if (state.comboCount > 1) createFloatingText(state.player.x + state.player.width/2, state.player.y - 10, `x${state.comboCount}`, '#ff00ff');

        state.crystals.splice(i, 1);
        scoreElement.textContent = `S C O R E : ${state.score.toString().padStart(6, '0')}`;
        if (state.score % 100 === 0) { state.gameSpeed += 0.5; }
        if (state.score > state.highScore) { state.highScore = state.score; try { localStorage.setItem('neondrift_highscore', String(state.highScore)); } catch (e) { } highScoreElement.textContent = `H I G H : ${state.highScore.toString().padStart(6, '0')}`; }
      } else if (state.crystals[i] && state.crystals[i].y > logicalHeight()) { state.crystals.splice(i, 1); }
    }

    for (let i = state.meteors.length - 1; i >= 0; i--) {
      state.meteors[i].y += state.meteors[i].speed * state.dtFactor * state.modifiers.gameSpeed;
      if (checkPlayerCollision(state.player, state.meteors[i])) { state.gameRunning = false; createParticle(state.player.x + state.player.width/2, state.player.y + state.player.height/2, '255, 0, 255', config.particles.DECAY_EXPLOSION); return; }
      else if (state.meteors[i] && state.meteors[i].y > logicalHeight()) { state.meteors.splice(i, 1); }
    }

    // Spawn scaling: increase spawn rate with game speed to maintain density
    const spawnScale = state.dtFactor;
    const speedBonus = 1 + (state.gameSpeed - config.INITIAL_GAME_SPEED) * 0.15; // +15% per speed level
    const crystalSpawnChance = config.SPAWN_CRYSTAL_RATE * spawnScale * speedBonus * state.modifiers.spawnRateCrystal;
    const meteorSpawnChance = config.SPAWN_METEOR_RATE * spawnScale * speedBonus * state.modifiers.spawnRateMeteor;
    
    if (Math.random() < crystalSpawnChance) spawnCrystal(state);
    if (Math.random() < meteorSpawnChance) spawnMeteor(state);
    
    // Independent magnet spawning from the sky (affected by diminishing returns when active)
    const magnetSpawnRate = config.SPAWN_MAGNET_RATE * spawnScale * state.modifiers.spawnRateMagnet;
    if (Math.random() < magnetSpawnRate) {
      // Spawn protection: check cooldown, max pickups and minimum distance
      const { MAX_POWERUP_PICKUPS, MIN_PICKUP_DISTANCE_X, PICKUP_DISTANCE_CHECK_Y, MAGNET_SPAWN_COOLDOWN_MS } = config.spawning;
      const now = performance.now();
      
      // Check 0: Cooldown - prevent pair spawning
      const cooldownPassed = (now - state.lastMagnetSpawnTimestamp) >= MAGNET_SPAWN_COOLDOWN_MS;
      
      // Check 1: Don't exceed max pickups on screen
      if (!cooldownPassed || state.powerUpPickups.length >= MAX_POWERUP_PICKUPS) {
        // Skip spawn
      } else {
        // Check 2: Find a valid spawn position (not too close to existing pickups)
        const x = Math.random() * (lw - 22); // 22 = pickup width
        const spawnY = -25;
        
        const tooClose = state.powerUpPickups.some(p => {
          const verticallyClose = Math.abs(p.y - spawnY) < PICKUP_DISTANCE_CHECK_Y;
          const horizontallyClose = Math.abs(p.x - x) < MIN_PICKUP_DISTANCE_X;
          return verticallyClose && horizontallyClose;
        });
        
        if (!tooClose) {
          // Determine style based on config
          const styles: Array<'horseshoe' | 'vortex' | 'ring' | 'field'> = ['horseshoe', 'vortex', 'ring', 'field'];
          const style = config.magnet.STYLE === 'random' 
            ? styles[Math.floor(Math.random() * styles.length)]
            : config.magnet.STYLE;
          
          spawnPowerUpPickup(state, 'magnet', x, spawnY, Math.max(3, state.gameSpeed * 1.2), style);
          state.lastMagnetSpawnTimestamp = now;
        }
      }
    }
    
    // Chain Lightning spawning (rarer than magnet, but exciting!)
    const chainLightningSpawnRate = config.SPAWN_CHAIN_LIGHTNING_RATE * spawnScale;
    if (Math.random() < chainLightningSpawnRate) {
      const { MAX_POWERUP_PICKUPS, MIN_PICKUP_DISTANCE_X, PICKUP_DISTANCE_CHECK_Y } = config.spawning;
      
      // Only spawn if we have space and crystals on screen
      if (state.powerUpPickups.length < MAX_POWERUP_PICKUPS && state.crystals.length >= 3) {
        const x = Math.random() * (lw - 22);
        const spawnY = -25;
        
        const tooClose = state.powerUpPickups.some(p => {
          const verticallyClose = Math.abs(p.y - spawnY) < PICKUP_DISTANCE_CHECK_Y;
          const horizontallyClose = Math.abs(p.x - x) < MIN_PICKUP_DISTANCE_X;
          return verticallyClose && horizontallyClose;
        });
        
        if (!tooClose) {
          spawnPowerUpPickup(state, 'chain_lightning', x, spawnY, Math.max(3, state.gameSpeed * 1.1));
        }
      }
    }
    
    // Time Slow spawning (same rarity as chain lightning)
    const timeSlowSpawnRate = config.SPAWN_TIME_SLOW_RATE * spawnScale;
    if (Math.random() < timeSlowSpawnRate) {
      const { MAX_POWERUP_PICKUPS, MIN_PICKUP_DISTANCE_X, PICKUP_DISTANCE_CHECK_Y } = config.spawning;
      
      if (state.powerUpPickups.length < MAX_POWERUP_PICKUPS) {
        const x = Math.random() * (lw - 22);
        const spawnY = -25;
        
        const tooClose = state.powerUpPickups.some(p => {
          const verticallyClose = Math.abs(p.y - spawnY) < PICKUP_DISTANCE_CHECK_Y;
          const horizontallyClose = Math.abs(p.x - x) < MIN_PICKUP_DISTANCE_X;
          return verticallyClose && horizontallyClose;
        });
        
        if (!tooClose) {
          // Determine style based on config
          const styles: Array<'clock' | 'hourglass'> = ['clock', 'hourglass'];
          const timeSlowStyle = config.TIME_SLOW_STYLE === 'random'
            ? styles[Math.floor(Math.random() * styles.length)]
            : config.TIME_SLOW_STYLE;
          
          spawnPowerUpPickup(state, 'time_slow', x, spawnY, Math.max(3, state.gameSpeed * 1.0), undefined, timeSlowStyle);
        }
      }
    }
  }

  function restartGame() {
    state.score = 0; state.gameSpeed = config.INITIAL_GAME_SPEED; state.gameRunning = true; state.crystals.length = 0; state.meteors.length = 0; state.particles.length = 0; 
    state.player.x = logicalWidth() / 2 - 25;
    // Reset player to bottom (or within bounds if vertical movement enabled)
    if (config.ENABLE_VERTICAL_MOVEMENT) {
      const lh = logicalHeight();
      state.player.y = lh - config.PLAYER_VERTICAL_PADDING - state.player.height;
    } else {
      state.player.y = logicalHeight() - 60;
    }
    state.player.trail = [];
    state.floatingTexts.length = 0; state.comboCount = 0; state.lastCollectTimestamp = 0;
    state.activePowerUps.length = 0; state.powerUpPickups.length = 0; state.chainLightningArcs.length = 0; state.timeSlowRipples.length = 0; state.pendingRevengeMeteors.length = 0; state.modifiers = { ...defaultModifiers };
    scoreElement.textContent = `S C O R E : ${state.score.toString().padStart(6, '0')}`;
  }

  // setup initial player and canvas
  resizeCanvas();
  const initialY = config.ENABLE_VERTICAL_MOVEMENT 
    ? logicalHeight() - config.PLAYER_VERTICAL_PADDING - 30 // 30 = player height
    : logicalHeight() - 60;
  state.player = { x: logicalWidth() / 2 - 25, y: initialY, width: 50, height: 30, speed: config.PLAYER_SPEED, trail: [] };

  let lastTimestamp = performance.now();
  let fps = 60;
  let debugEnabled = true;
  // attach debug flags to state so renderers can read them
  (state as any).debug = { grid: true, boxes: false, particles: true };

  // Debug panel DOM elements
  const debugPanel = document.getElementById('debugPanel') as HTMLElement;
  const debugFps = document.getElementById('debugFps') as HTMLElement;
  const debugDt = document.getElementById('debugDt') as HTMLElement;
  const debugParticlesEl = document.getElementById('debugParticles') as HTMLElement;
  const debugSpeed = document.getElementById('debugSpeed') as HTMLElement;
  const debugCrystals = document.getElementById('debugCrystals') as HTMLElement;
  const debugMeteors = document.getElementById('debugMeteors') as HTMLElement;
  const debugPickups = document.getElementById('debugPickups') as HTMLElement;
  const debugMagnetStacks = document.getElementById('debugMagnetStacks') as HTMLElement;
  const debugMagnetRate = document.getElementById('debugMagnetRate') as HTMLElement;
  const debugMagnetTime = document.getElementById('debugMagnetTime') as HTMLElement;
  const statusGrid = document.getElementById('statusGrid') as HTMLElement;
  const statusBoxes = document.getElementById('statusBoxes') as HTMLElement;
  const statusParticles = document.getElementById('statusParticles') as HTMLElement;

  function updateDebugPanel() {
    if (!debugPanel) return;
    debugPanel.classList.toggle('visible', debugEnabled);
    if (!debugEnabled) return;
    
    debugFps.textContent = Math.round(state.fps || 60).toString();
    debugDt.textContent = state.dtFactor.toFixed(2);
    debugParticlesEl.textContent = state.particles.length.toString();
    debugSpeed.textContent = state.gameSpeed.toFixed(2);
    debugCrystals.textContent = state.crystals.length.toString();
    debugMeteors.textContent = state.meteors.length.toString();
    debugPickups.textContent = state.powerUpPickups.length.toString();
    
    // Magnet power-up info
    const magnetPowerUp = state.activePowerUps.find(p => p.id === 'magnet');
    const magnetStacks = magnetPowerUp?.stacks ?? 0;
    const magnetTier = state.modifiers.magnetPullTier || 0;
    const magnetRatePercent = Math.round(state.modifiers.spawnRateMagnet * 100);
    const magnetTimeLeft = magnetPowerUp?.expiresAt ? Math.max(0, (magnetPowerUp.expiresAt - performance.now()) / 1000) : 0;
    const isSuperMagnet = state.modifiers.superMagnet;
    
    // Show tier with visual indicator
    const tierLabels = ['', 'T1', 'T2 ⚡', 'T3 ⚡⚡'];
    const tierColors = ['#666', '#ff6644', '#ff9944', '#ffcc00'];
    debugMagnetStacks.textContent = isSuperMagnet ? `${magnetStacks} SUPER!` : `${magnetStacks} ${tierLabels[magnetTier] || ''}`;
    debugMagnetStacks.style.color = tierColors[magnetTier] || '#ff6644';
    debugMagnetRate.textContent = `${magnetRatePercent}%`;
    debugMagnetTime.textContent = magnetTimeLeft > 0 ? `${magnetTimeLeft.toFixed(1)}s` : '-';
    
    const debug = (state as any).debug;
    statusGrid.textContent = debug.grid ? 'ON' : 'OFF';
    statusGrid.className = 'status ' + (debug.grid ? 'on' : 'off');
    statusBoxes.textContent = debug.boxes ? 'ON' : 'OFF';
    statusBoxes.className = 'status ' + (debug.boxes ? 'on' : 'off');
    statusParticles.textContent = debug.particles ? 'ON' : 'OFF';
    statusParticles.className = 'status ' + (debug.particles ? 'on' : 'off');
  }

  // Wire up clickable toggles
  document.getElementById('toggleGrid')?.addEventListener('click', () => {
    (state as any).debug.grid = !(state as any).debug.grid;
  });
  document.getElementById('toggleBoxes')?.addEventListener('click', () => {
    (state as any).debug.boxes = !(state as any).debug.boxes;
  });
  document.getElementById('toggleParticles')?.addEventListener('click', () => {
    (state as any).debug.particles = !(state as any).debug.particles;
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === '`' || e.key === '~') debugEnabled = !debugEnabled;
    if (e.key.toLowerCase() === 'g') (state as any).debug.grid = !(state as any).debug.grid;
    if (e.key.toLowerCase() === 'b') (state as any).debug.boxes = !(state as any).debug.boxes;
    if (e.key.toLowerCase() === 'p') (state as any).debug.particles = !(state as any).debug.particles;
  });

  let lastFpsTimestamp = performance.now();
  let fpsAccumulator = 0;
  
  // FPS limiter settings
  const targetFrameTime = config.TARGET_FPS > 0 ? 1000 / config.TARGET_FPS : 0;
  let frameAccumulator = 0;

  function gameLoop(timestamp: number) {
    const elapsed = timestamp - lastTimestamp;
    
    // FPS limiter: skip frame if running faster than target
    if (targetFrameTime > 0) {
      frameAccumulator += elapsed;
      if (frameAccumulator < targetFrameTime) {
        requestAnimationFrame(gameLoop);
        return;
      }
      frameAccumulator -= targetFrameTime;
      // Prevent spiral of death if we fall behind
      if (frameAccumulator > targetFrameTime * 2) {
        frameAccumulator = 0;
      }
    }
    
    const dtSeconds = Math.min(elapsed / 1000, 0.05);
    lastTimestamp = timestamp;
    state.dtFactor = dtSeconds * 60;

    const now = performance.now();
    const frameDt = now - lastFpsTimestamp;
    state.fps = 1000 / Math.max(1, frameDt);
    lastFpsTimestamp = now;

    update();
    
    // Scale animation time by game speed (slow-mo affects rotations, pulses, etc.)
    state.time += dtSeconds * state.modifiers.gameSpeed;

    // render via renderer module (pass the whole state, but disable canvas debug overlay)
    renderScene(Object.assign({ debugEnabled: false }, state));
    
    // Update the external HTML debug panel
    updateDebugPanel();
    
    requestAnimationFrame(gameLoop);
  }

  // Use state-driven restart request (set by input)
  document.addEventListener('keydown', (e) => {
    if (!state.gameRunning && (state as any)._restartRequested) {
      (state as any)._restartRequested = false;
      restartGame();
    }
  });

  // wire resize event
  window.addEventListener('resize', () => { requestAnimationFrame(resizeCanvas); });

  restartGame(); lastTimestamp = performance.now(); requestAnimationFrame(gameLoop);
}
