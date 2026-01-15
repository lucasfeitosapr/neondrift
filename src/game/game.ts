import { config } from './config';
import { initInput, keys, touchState } from './input';
import { renderScene } from './renderer';
import { spawnCat, spawnCrystal, spawnMeteor, spawnRevengeMeteor } from './spawner';
import { GameState, Particle, ParticleColorMode } from './types';
import { createState, defaultModifiers } from './state';
import { activatePowerUp, tickPowerUps } from './powerups/system';
import { spawnPowerUpPickup, updatePowerUpPickups } from './powerups/pickups';
import { checkCollision, checkPlayerCollision } from './collision';
import { updatePlayerPosition, getInitialPlayerY, clampPlayerPosition, MovementInput } from './movement';
import {
  processCrystalCollection,
  shouldIncreaseGameSpeed,
  calculateNewGameSpeed,
  getDifficultyLevel,
  getDifficultyPercent,
  getMaxDifficultyLevel,
  isNewHighScore,
  getScoreDisplayText,
  getHighScoreDisplayText,
  getPointsText,
  getComboText
} from './scoring';
import { EventManager } from './eventManager';
import { removeAtSwap } from './utils/arrayUtils';

export function startGame(): void {
  // ...existing code migrated from neon_drift.html script section...
  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  const scoreElement = document.getElementById('score') as HTMLElement;
  const highScoreElement = document.getElementById('highScore') as HTMLElement;

  // Event manager to track and clean up event listeners
  const eventManager = new EventManager();

  // Helpers to read logical (CSS) canvas size when DPR scaling is applied
  function logicalWidth() { return state.viewport?.width ?? canvas.width; }
  function logicalHeight() { return state.viewport?.height ?? canvas.height; }

  // Create single shared game state (use typed GameState)
  const state: GameState = createState(canvas, ctx);
  const pauseButton = document.getElementById('pauseBtn') as HTMLButtonElement | null;

  function syncPauseButton() {
    if (!pauseButton) return;
    pauseButton.classList.toggle('paused', state.paused);
    pauseButton.textContent = state.paused ? 'R E S U M E' : 'P A U S E';
    pauseButton.disabled = !state.gameRunning;
    pauseButton.setAttribute('aria-pressed', state.paused ? 'true' : 'false');
    pauseButton.title = state.paused ? 'Resume (P / Esc)' : 'Pause (P / Esc)';
  }

  function setPauseState(paused: boolean, options?: { showCountdown?: boolean }) {
    const effectivePause = paused && state.gameRunning;
    const wasPaused = state.paused;
    state.paused = effectivePause;
    if (!effectivePause && wasPaused && options?.showCountdown) {
      const countdownDuration = 3000;
      state.resumeCountdownActive = true;
      state.resumeCountdownTarget = performance.now() + countdownDuration;
      state.resumeCountdownValue = 3;
    } else if (effectivePause) {
      state.resumeCountdownActive = false;
      state.resumeCountdownTarget = null;
      state.resumeCountdownValue = undefined;
    }
    syncPauseButton();
  }

  function togglePause(force?: boolean) {
    if (!state.gameRunning) {
      setPauseState(false);
      return;
    }
    const next = force ?? !state.paused;
    setPauseState(next, { showCountdown: !next });
  }

  if (pauseButton) {
    eventManager.addEventListener(pauseButton, 'click', () => {
      togglePause();
    });
  }

  syncPauseButton();

  // update UI highscore text
  highScoreElement.textContent = getHighScoreDisplayText(state.highScore);

  // Telemetry removed (was experimental)

  // Floating score texts
  function createFloatingText(x: number, y: number, text: string, color = '#00ffff') {
    state.floatingTexts.push({ x, y, text, life: 1, color, vy: -0.3 - Math.random() * 0.4 });
  }

  function getComboDifficultyMultipliers(comboCount: number) {
    const comboSettings = config.dynamicDifficulty?.combo;
    if (!comboSettings) return { spawnMultiplier: 1, meteorSpeedMultiplier: 1 };
    const {
      minComboForAggro,
      spawnBonusPerLevel,
      spawnMaxMultiplier,
      lowComboSpawnMultiplier,
      meteorSpeedBonusPerLevel,
      meteorSpeedMaxMultiplier,
      lowComboSpeedMultiplier
    } = comboSettings;

    if (comboCount >= minComboForAggro) {
      const levelsAbove = comboCount - minComboForAggro + 1;
      const spawnMultiplier = Math.min(spawnMaxMultiplier, 1 + levelsAbove * spawnBonusPerLevel);
      const meteorSpeedMultiplier = Math.min(
        meteorSpeedMaxMultiplier,
        1 + levelsAbove * meteorSpeedBonusPerLevel
      );
      return { spawnMultiplier, meteorSpeedMultiplier };
    }

    const minAggroThreshold = Math.max(1, minComboForAggro - 1);
    const blend = Math.min(1, comboCount / minAggroThreshold);
    const spawnMultiplier = lowComboSpawnMultiplier + (1 - lowComboSpawnMultiplier) * blend;
    const meteorSpeedMultiplier = lowComboSpeedMultiplier + (1 - lowComboSpeedMultiplier) * blend;
    return { spawnMultiplier, meteorSpeedMultiplier };
  }

  // Initialize grid
  for (let i = 0; i < 20; i++) {
    state.gridLines.push({ y: i * 30, opacity: Math.random() * 0.5 + 0.1 });
  }

  // Input handling
  initInput(state, eventManager);

  // Responsive DPR-aware resize handler: set CSS size and high-DPI backing buffer
  function resizeCanvas() {
    const padding = 32;
    const titleEl = document.querySelector('.title') as HTMLElement | null;
    const controlsEl = document.querySelector('.controls') as HTMLElement | null;
    const touchHintEl = document.querySelector('.touch-hint') as HTMLElement | null;
    const topHudEl = document.querySelector('.right-panel') as HTMLElement | null;
    const titleHeight = titleEl?.getBoundingClientRect().height ?? 0;
    const controlsHeight = controlsEl?.getBoundingClientRect().height ?? 0;
    const touchHintHeight = touchHintEl?.getBoundingClientRect().height ?? 0;
    const topHudHeight = topHudEl?.getBoundingClientRect().height ?? 0;
    const uiHeight = titleHeight + topHudHeight + Math.max(controlsHeight, touchHintHeight) + 24;

    // Mobile-friendly sizing: fit canvas to available space
    const availableWidth = window.innerWidth - padding;
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    const availableHeight = viewportHeight - uiHeight - padding;
    
    // Maintain aspect ratio (360:640 ≈ 0.5625)
    const targetAspect = config.CANVAS_WIDTH / config.CANVAS_HEIGHT;
    const maxCanvasWidth = 520;
    let cssWidth = Math.min(maxCanvasWidth, availableWidth); // Cap width for comfortable play area
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

    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
    canvas.width = Math.max(1, Math.floor(cssWidth * dpr));
    canvas.height = Math.max(1, Math.floor(cssHeight * dpr));

    // Update viewport information
    state.viewport = { width: cssWidth, height: cssHeight, dpr };

    try { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); } catch { /* DPR transform not supported */ }

    if (state.player) {
      // Center player horizontally and clamp to bounds using movement module
      state.player.x = Math.floor(logicalWidth() / 2 - state.player.width / 2);
      const clampedPos = clampPlayerPosition(
        state.player,
        logicalWidth(),
        logicalHeight(),
        config.ENABLE_VERTICAL_MOVEMENT
      );
      state.player.y = clampedPos.y;
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
  // collision detection moved to src/game/collision.ts

  function update() {
    if (!state.gameRunning) return;
    const now = performance.now();

    if (state.paused) return;

    if (state.resumeCountdownActive) {
      const target = state.resumeCountdownTarget ?? now;
      const remainingMs = Math.max(0, target - now);
      if (remainingMs <= 0) {
        state.resumeCountdownActive = false;
        state.resumeCountdownTarget = null;
        state.resumeCountdownValue = undefined;
      } else {
        const nextValue = Math.max(1, Math.ceil(remainingMs / 1000));
        if (nextValue !== state.resumeCountdownValue) {
          state.resumeCountdownValue = nextValue;
        }
        return;
      }
    }
    const dtMs = state.dtFactor * (1000 / 60);
    tickPowerUps(state, now, dtMs);
    
    // Decay chain lightning arcs (optimized: swap-and-pop instead of splice)
    for (let i = state.chainLightningArcs.length - 1; i >= 0; i--) {
      state.chainLightningArcs[i].life -= 0.03 * state.dtFactor;
      if (state.chainLightningArcs[i].life <= 0) {
        removeAtSwap(state.chainLightningArcs, i);
      }
    }
    
    // Decay time slow ripples (optimized: swap-and-pop instead of splice)
    for (let i = state.timeSlowRipples.length - 1; i >= 0; i--) {
      const ripple = state.timeSlowRipples[i];
      if (now - ripple.startTime >= ripple.durationMs) {
        removeAtSwap(state.timeSlowRipples, i);
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
        removeAtSwap(state.pendingRevengeMeteors, i);
      }
    }

    const lw = logicalWidth();
    const lh = logicalHeight();
    const comboScaling = getComboDifficultyMultipliers(state.comboCount);

    // Player movement using movement module
    if (touchState.active) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = lw / rect.width;
      const scaleY = lh / rect.height;

      if (!state._touchAnchor) {
        state._touchAnchor = {
          playerX: state.player.x,
          playerY: state.player.y,
          startX: touchState.startClientX,
          startY: touchState.startClientY
        };
      }

      const anchor = state._touchAnchor;
      if (!anchor) return;
      const dx = (touchState.clientX - anchor.startX) * scaleX;
      const dy = (touchState.clientY - anchor.startY) * scaleY;

      state.player.x = anchor.playerX + dx;
      if (config.ENABLE_VERTICAL_MOVEMENT) {
        state.player.y = anchor.playerY + dy;
      }

      const clamped = clampPlayerPosition(
        state.player,
        lw,
        lh,
        config.ENABLE_VERTICAL_MOVEMENT
      );
      state.player.x = clamped.x;
      state.player.y = clamped.y;
    } else {
      state._touchAnchor = null;
      const movementInput: MovementInput = {
        left: keys['arrowleft'] || keys['a'],
        right: keys['arrowright'] || keys['d'],
        up: keys['arrowup'] || keys['w'],
        down: keys['arrowdown'] || keys['s']
      };
      const newPos = updatePlayerPosition(
        state.player,
        movementInput,
        state.dtFactor,
        lw,
        lh,
        state.modifiers.playerSpeed,
        config.ENABLE_VERTICAL_MOVEMENT
      );
      state.player.x = newPos.x;
      state.player.y = newPos.y;
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
        
        if (isOnScreen && state.player) {
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
      if (state.player && checkCollision(state.player, crystal)) {
        // Use scoring module for crystal collection
        const previousScore = state.score;
        const collectionResult = processCrystalCollection(
          crystal.type.points,
          now,
          state.lastCollectTimestamp,
          state.comboCount,
          state.modifiers.scoreMultiplier
        );

        state.comboCount = collectionResult.newComboCount;
        state.lastCollectTimestamp = now;
        state.score += collectionResult.pointsAwarded;

        let particleColor: string | 'rainbow';
        switch(crystal.type.color) { case 'purple': particleColor = '170, 0, 255'; break; case 'gold': particleColor = '255, 170, 0'; break; case 'rainbow': particleColor = 'rainbow'; break; default: particleColor = '0, 255, 255'; }
        createParticle(crystal.x + crystal.width/2, crystal.y + crystal.height/2, particleColor);
        createFloatingText(crystal.x + crystal.width/2, crystal.y, getPointsText(collectionResult.pointsAwarded), '#00ffff');
        if (state.comboCount > 1 && state.player) createFloatingText(state.player.x + state.player.width/2, state.player.y - 10, getComboText(state.comboCount), '#ff00ff');

        removeAtSwap(state.crystals, i);
        scoreElement.textContent = getScoreDisplayText(state.score);
        if (shouldIncreaseGameSpeed(previousScore, state.score)) { state.gameSpeed = calculateNewGameSpeed(state.gameSpeed); }
        // Force max difficulty if toggle is on
        if (state.debug?.forceMaxDifficulty) { state.gameSpeed = config.difficulty.MAX_GAME_SPEED; }
        if (isNewHighScore(state.score, state.highScore)) { state.highScore = state.score; try { localStorage.setItem('neondrift_highscore', String(state.highScore)); } catch { /* localStorage unavailable */ } highScoreElement.textContent = getHighScoreDisplayText(state.highScore); }
      } else if (state.crystals[i] && state.crystals[i].y > logicalHeight()) { removeAtSwap(state.crystals, i); }
    }

    for (let i = state.cats.length - 1; i >= 0; i--) {
      const cat = state.cats[i];
      cat.y += cat.speed * state.dtFactor * state.modifiers.gameSpeed;

      if (state.player && checkCollision(state.player, cat)) {
        const previousScore = state.score;
        const difficultyLevel = getDifficultyLevel(state.score);
        const points = Math.floor(
          config.cat.basePoints * (1 + (difficultyLevel - 1) * config.cat.pointsScalePerLevel) * state.modifiers.scoreMultiplier
        );

        state.score += points;
        createParticle(cat.x + cat.width / 2, cat.y + cat.height / 2, '255, 150, 255');
        createFloatingText(cat.x + cat.width / 2, cat.y, `+${points} CAT`, '#ff99ff');
        removeAtSwap(state.cats, i);
        scoreElement.textContent = getScoreDisplayText(state.score);

        if (shouldIncreaseGameSpeed(previousScore, state.score)) { state.gameSpeed = calculateNewGameSpeed(state.gameSpeed); }
        if (state.debug?.forceMaxDifficulty) { state.gameSpeed = config.difficulty.MAX_GAME_SPEED; }
        if (isNewHighScore(state.score, state.highScore)) {
          state.highScore = state.score;
          try { localStorage.setItem('neondrift_highscore', String(state.highScore)); } catch { /* localStorage unavailable */ }
          highScoreElement.textContent = getHighScoreDisplayText(state.highScore);
        }
      } else if (state.cats[i] && state.cats[i].y > logicalHeight()) {
        removeAtSwap(state.cats, i);
      }
    }

    for (let i = state.meteors.length - 1; i >= 0; i--) {
      state.meteors[i].y += state.meteors[i].speed * comboScaling.meteorSpeedMultiplier * state.dtFactor * state.modifiers.gameSpeed;
      if (state.player && checkPlayerCollision(state.player, state.meteors[i]) && !state.debug?.invincibility) { 
        state.gameRunning = false; 
        syncPauseButton(); 
        createParticle(state.player.x + state.player.width/2, state.player.y + state.player.height/2, '255, 0, 255', config.particles.DECAY_EXPLOSION); 
        return; 
      }
      else if (state.meteors[i] && state.meteors[i].y > logicalHeight()) { removeAtSwap(state.meteors, i); }
    }

    const catCooldownPassed = (now - state.lastCatSpawnTimestamp) >= config.cat.spawnCooldownMs;
    if (catCooldownPassed && state.cats.length < config.cat.maxOnScreen) {
      const catSpawnChance = config.cat.spawnChance * state.dtFactor;
      if (Math.random() < catSpawnChance) {
        spawnCat(state);
        state.lastCatSpawnTimestamp = now;
      }
    }

    // Spawn scaling: increase spawn rate with game speed to maintain density
    const spawnScale = state.dtFactor;
    const speedBonus = 1 + (state.gameSpeed - config.INITIAL_GAME_SPEED) * 0.15; // +15% per speed level
    const crystalSpawnChance = config.SPAWN_CRYSTAL_RATE * spawnScale * speedBonus * state.modifiers.spawnRateCrystal * comboScaling.spawnMultiplier;
    const meteorSpawnChance = config.SPAWN_METEOR_RATE * spawnScale * speedBonus * state.modifiers.spawnRateMeteor * comboScaling.spawnMultiplier;
    
    if (Math.random() < crystalSpawnChance) spawnCrystal(state);
    if (Math.random() < meteorSpawnChance && state.debug?.meteors) spawnMeteor(state);
    
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
    state.score = 0; state.gameSpeed = config.INITIAL_GAME_SPEED; state.gameRunning = true; state.paused = false; state.resumeCountdownActive = false; state.resumeCountdownTarget = null; state.resumeCountdownValue = undefined; syncPauseButton(); state.crystals.length = 0; state.meteors.length = 0; state.cats.length = 0; state.particles.length = 0;
    state.player.x = logicalWidth() / 2 - 25;
    // Reset player position using movement module
    state.player.y = getInitialPlayerY(logicalHeight(), state.player.height, config.ENABLE_VERTICAL_MOVEMENT);
    state.player.trail = [];
    state.floatingTexts.length = 0; state.comboCount = 0; state.lastCollectTimestamp = 0;
    state.activePowerUps.length = 0; state.powerUpPickups.length = 0; state.chainLightningArcs.length = 0; state.timeSlowRipples.length = 0; state.pendingRevengeMeteors.length = 0; state.modifiers = { ...defaultModifiers }; state.lastCatSpawnTimestamp = 0;
    scoreElement.textContent = getScoreDisplayText(state.score);
  }

  // setup initial player and canvas
  resizeCanvas();
  const playerHeight = 30;
  const initialY = getInitialPlayerY(logicalHeight(), playerHeight, config.ENABLE_VERTICAL_MOVEMENT);
  state.player = { x: logicalWidth() / 2 - 25, y: initialY, width: 50, height: playerHeight, speed: config.PLAYER_SPEED, trail: [] };

  let lastTimestamp = performance.now();
  let debugEnabled = state.debugEnabled ?? true;

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
  const debugDifficulty = document.getElementById('debugDifficulty') as HTMLElement;
  const difficultyFill = document.getElementById('difficultyFill') as HTMLElement;
  const debugSpawnRate = document.getElementById('debugSpawnRate') as HTMLElement;
  const debugPlayerPos = document.getElementById('debugPlayerPos') as HTMLElement;
  const statusGrid = document.getElementById('statusGrid') as HTMLElement;
  const statusBoxes = document.getElementById('statusBoxes') as HTMLElement;
  const statusParticles = document.getElementById('statusParticles') as HTMLElement;
  const statusInvincibility = document.getElementById('statusInvincibility') as HTMLElement;
  const statusMeteors = document.getElementById('statusMeteors') as HTMLElement;
  const statusForceMaxDifficulty = document.getElementById('statusForceMaxDifficulty') as HTMLElement;

  function updateDebugPanel() {
    if (!debugPanel) return;
    debugPanel.classList.toggle('visible', debugEnabled);
    if (!debugEnabled) return;
    
    debugFps.textContent = Math.round(state.fps || 60).toString();
    debugDt.textContent = state.dtFactor.toFixed(2);
    debugParticlesEl.textContent = state.particles.length.toString();
    debugSpeed.textContent = state.gameSpeed.toFixed(2);

    // Difficulty scaling indicator
    const diffLevel = getDifficultyLevel(state.score);
    const diffPercent = getDifficultyPercent(state.gameSpeed);
    const isMaxDifficulty = state.gameSpeed >= config.difficulty.MAX_GAME_SPEED - 1e-6;
    const maxDiffLevel = getMaxDifficultyLevel();
    const displayLevel = isMaxDifficulty ? Math.min(diffLevel, maxDiffLevel) : diffLevel;
    if (debugDifficulty) {
      debugDifficulty.textContent = isMaxDifficulty ? `Lv.${displayLevel} (MAX!)` : `Lv.${diffLevel} (${diffPercent}%)`;
      debugDifficulty.style.color = isMaxDifficulty ? '#ff4444' : diffPercent > 70 ? '#ffaa00' : '#00ff88';
    }
    if (difficultyFill) {
      difficultyFill.style.width = `${diffPercent}%`;
    }

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
    
    // Spawn rate display (crystal spawn rate)
    debugSpawnRate.textContent = config.SPAWN_CRYSTAL_RATE.toFixed(3);
    
    // Player position display
    if (state.player) {
      debugPlayerPos.textContent = `${Math.round(state.player.x)}, ${Math.round(state.player.y)}`;
    } else {
      debugPlayerPos.textContent = '0, 0';
    }
    
    const debug = state.debug || { grid: false, boxes: false, particles: false, invincibility: false, meteors: true, forceMaxDifficulty: false };
    statusGrid.textContent = debug.grid ? 'ON' : 'OFF';
    statusGrid.className = 'status ' + (debug.grid ? 'on' : 'off');
    statusBoxes.textContent = debug.boxes ? 'ON' : 'OFF';
    statusBoxes.className = 'status ' + (debug.boxes ? 'on' : 'off');
    statusParticles.textContent = debug.particles ? 'ON' : 'OFF';
    statusParticles.className = 'status ' + (debug.particles ? 'on' : 'off');
    statusInvincibility.textContent = debug.invincibility ? 'ON' : 'OFF';
    statusInvincibility.className = 'status ' + (debug.invincibility ? 'on' : 'off');
    statusMeteors.textContent = debug.meteors ? 'ON' : 'OFF';
    statusMeteors.className = 'status ' + (debug.meteors ? 'on' : 'off');
    statusForceMaxDifficulty.textContent = debug.forceMaxDifficulty ? 'ON' : 'OFF';
    statusForceMaxDifficulty.className = 'status ' + (debug.forceMaxDifficulty ? 'on' : 'off');
  }

  // Wire up clickable toggles
  const toggleGrid = document.getElementById('toggleGrid');
  if (toggleGrid) {
    eventManager.addEventListener(toggleGrid, 'click', () => {
      if (state.debug) state.debug.grid = !state.debug.grid;
    });
  }
  const toggleBoxes = document.getElementById('toggleBoxes');
  if (toggleBoxes) {
    eventManager.addEventListener(toggleBoxes, 'click', () => {
      if (state.debug) state.debug.boxes = !state.debug.boxes;
    });
  }
  const toggleParticles = document.getElementById('toggleParticles');
  if (toggleParticles) {
    eventManager.addEventListener(toggleParticles, 'click', () => {
      if (state.debug) state.debug.particles = !state.debug.particles;
    });
  }
  const toggleInvincibility = document.getElementById('toggleInvincibility');
  if (toggleInvincibility) {
    eventManager.addEventListener(toggleInvincibility, 'click', () => {
      if (state.debug) state.debug.invincibility = !state.debug.invincibility;
    });
  }
  const toggleMeteors = document.getElementById('toggleMeteors');
  if (toggleMeteors) {
    eventManager.addEventListener(toggleMeteors, 'click', () => {
      if (state.debug) state.debug.meteors = !state.debug.meteors;
    });
  }
  const toggleForceMaxDifficulty = document.getElementById('toggleForceMaxDifficulty');
  if (toggleForceMaxDifficulty) {
    eventManager.addEventListener(toggleForceMaxDifficulty, 'click', () => {
      if (state.debug) state.debug.forceMaxDifficulty = !state.debug.forceMaxDifficulty;
    });
  }

  const keydownHandler = (e: KeyboardEvent) => {
    if (e.key === '`' || e.key === '~') debugEnabled = !debugEnabled;
    if (e.key.toLowerCase() === 'g' && state.debug) state.debug.grid = !state.debug.grid;
    if (e.key.toLowerCase() === 'b' && state.debug) state.debug.boxes = !state.debug.boxes;
    if (e.key === 'Escape') {
      togglePause();
    }
    if (e.key.toLowerCase() === 'p') {
      if (e.shiftKey && state.debug) {
        state.debug.particles = !state.debug.particles;
      } else {
        togglePause();
      }
    }
    if (e.key.toLowerCase() === 'i' && state.debug) state.debug.invincibility = !state.debug.invincibility;
    if (e.key.toLowerCase() === 'm' && state.debug) state.debug.meteors = !state.debug.meteors;
    if (e.key.toLowerCase() === 'f' && state.debug) state.debug.forceMaxDifficulty = !state.debug.forceMaxDifficulty;
  };
  eventManager.addEventListener(document, 'keydown', keydownHandler);

  let lastFpsTimestamp = performance.now();

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

    // render via renderer module (canvas debug overlay disabled - use HTML panel instead)
    renderScene({ ...state, debugEnabled: false });
    
    // Update the external HTML debug panel
    updateDebugPanel();
    
    requestAnimationFrame(gameLoop);
  }

  // Use state-driven restart request (set by input)
  const restartKeyHandler = () => {
    if (!state.gameRunning && state._restartRequested) {
      state._restartRequested = false;
      restartGame();
    }
  };
  eventManager.addEventListener(document, 'keydown', restartKeyHandler);

  // wire resize event
  const resizeHandler = () => { requestAnimationFrame(resizeCanvas); };
  eventManager.addEventListener(window, 'resize', resizeHandler);

  // Cleanup function to remove all event listeners
  function cleanup() {
    eventManager.cleanup();
  }

  // Store cleanup function in state for potential future use
  (state as GameState & { _cleanup?: () => void })._cleanup = cleanup;

  restartGame(); lastTimestamp = performance.now(); requestAnimationFrame(gameLoop);
}
