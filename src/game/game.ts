import { config } from './config';
import { initInput, keys, touchState } from './input';
import { renderScene } from './renderer';
import { spawnCat, spawnCrystal, spawnMeteor, spawnRevengeMeteor } from './spawner';
import { GameState } from './types';
import { createState } from './state';
import { random } from './rng';
import { fetchQuantumSeed } from './quantum';
import { getDailyChallengeSeed } from './dailyChallenge';
import { RunSeedPayload } from './types';
import { activatePowerUp, tickPowerUps } from './powerups/system';
import { spawnPowerUpPickup, updatePowerUpPickups } from './powerups/pickups';
import { checkCollision, checkPlayerCollision } from './collision';
import { updatePlayerPosition, getInitialPlayerY, clampPlayerPosition, MovementInput } from './movement';
import {
  processCrystalCollection,
  shouldIncreaseGameSpeed,
  calculateNewGameSpeed,
  getDifficultyLevel,
  getPointsText,
  getComboText
} from './scoring';
import { EventManager } from './eventManager';
import { removeAtSwap } from './utils/arrayUtils';
import { createPauseSystem } from './pauseSystem';
import { restartGame } from './restartSystem';
import { createFloatingText } from './utils/floatingText';
import { createParticle } from './utils/particles';
import { getComboDifficultyMultipliers } from './utils/comboDifficulty';
import { resizeCanvas } from './utils/canvasResize';
import {
  updateDebugPanel,
  wireDebugPanelControls,
  createDebugKeyHandler
} from './ui/debugPanel';
import { debugControls } from './ui/debugPanelConfig';
import { updateScoreDisplay, initializeHighScoreDisplay } from './ui/scoreDisplay';
import { activateRainbowRain, tickRainbowRain } from './events/rainbowRain';
import { analyzeRunSeed } from './oracle';
import { drawOracle } from './render/oracle';

export function startGame(mode: 'normal' | 'daily' = 'normal', seedOverride?: RunSeedPayload): void {
  // ...existing code migrated from neon_drift.html script section...
  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  const scoreElement = document.getElementById('score') as HTMLElement;
  const highScoreElement = document.getElementById('highScore') as HTMLElement;
  const timerElement = document.getElementById('runTimer') as HTMLElement | null;

  // Event manager to track and clean up event listeners
  const eventManager = new EventManager();

  // Create single shared game state (use typed GameState)
  const state: GameState = createState(canvas, ctx);

  // Helpers to read logical (CSS) canvas size when DPR scaling is applied
  function logicalWidth() { return state.viewport?.width ?? canvas.width; }
  function logicalHeight() { return state.viewport?.height ?? canvas.height; }
  const pauseButton = document.getElementById('pauseBtn') as HTMLButtonElement | null;

  // Initialize pause system
  const pauseSystem = createPauseSystem(state, pauseButton, eventManager);

  // Initialize high score display
  initializeHighScoreDisplay(state.highScore, highScoreElement);

  // Telemetry removed (was experimental)

  // Initialize grid
  for (let i = 0; i < 20; i++) {
    state.gridLines.push({ y: i * 30, opacity: Math.random() * 0.5 + 0.1 });
  }

  // Input handling
  initInput(state, eventManager);

  // Responsive DPR-aware resize handler: set CSS size and high-DPI backing buffer
  function handleResize() {
    resizeCanvas(canvas, ctx, state, logicalWidth, logicalHeight);
  }

  // drawing logic moved to src/game/render/* via renderer
  // collision detection moved to src/game/collision.ts

  function update() {
    if (!state.gameRunning) return;
    const now = performance.now();

    if (state.paused) return;

    // Handle resume countdown
    if (pauseSystem.updateResumeCountdown(now)) {
      return;
    }
    const dtMs = state.dtFactor * (1000 / 60);
    state.runElapsedMs += dtMs;
    tickPowerUps(state, now, dtMs);
    tickRainbowRain(state, now, dtMs);
    
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
        if (state.player) {
          createFloatingText(state, state.player.x + state.player.width/2, state.player.y - 28, id === 'magnet' ? 'MAGNET ON' : id.toUpperCase(), '#7ce7ff');
        }
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
        createParticle(state, crystal.x + crystal.width/2, crystal.y + crystal.height/2, particleColor);
        createFloatingText(state, crystal.x + crystal.width/2, crystal.y, getPointsText(collectionResult.pointsAwarded), '#00ffff');
        if (state.comboCount > 1 && state.player) createFloatingText(state, state.player.x + state.player.width/2, state.player.y - 10, getComboText(state.comboCount), '#ff00ff');

        removeAtSwap(state.crystals, i);
        updateScoreDisplay(state, scoreElement, highScoreElement);
        if (shouldIncreaseGameSpeed(previousScore, state.score)) { state.gameSpeed = calculateNewGameSpeed(state.gameSpeed); }
        // Force max difficulty if toggle is on
        if (state.debug?.forceMaxDifficulty) { state.gameSpeed = config.difficulty.MAX_GAME_SPEED; }
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
        createParticle(state, cat.x + cat.width / 2, cat.y + cat.height / 2, '255, 150, 255');
        createFloatingText(state, cat.x + cat.width / 2, cat.y, `+${points} CAT`, '#ff99ff');
        removeAtSwap(state.cats, i);
        updateScoreDisplay(state, scoreElement, highScoreElement);

        if (shouldIncreaseGameSpeed(previousScore, state.score)) { state.gameSpeed = calculateNewGameSpeed(state.gameSpeed); }
        if (state.debug?.forceMaxDifficulty) { state.gameSpeed = config.difficulty.MAX_GAME_SPEED; }
      } else if (state.cats[i] && state.cats[i].y > logicalHeight()) {
        removeAtSwap(state.cats, i);
      }
    }

    for (let i = state.meteors.length - 1; i >= 0; i--) {
      state.meteors[i].y += state.meteors[i].speed * comboScaling.meteorSpeedMultiplier * state.dtFactor * state.modifiers.gameSpeed;
      if (state.player && checkPlayerCollision(state.player, state.meteors[i]) && !state.debug?.invincibility) { 
        state.gameRunning = false; 
        pauseSystem.syncPauseButton(); 
        createParticle(state, state.player.x + state.player.width/2, state.player.y + state.player.height/2, '255, 0, 255', config.particles.DECAY_EXPLOSION); 
        return; 
      }
      else if (state.meteors[i] && state.meteors[i].y > logicalHeight()) { removeAtSwap(state.meteors, i); }
    }

    const catCooldownPassed = (now - state.lastCatSpawnTimestamp) >= config.cat.spawnCooldownMs;
    if (catCooldownPassed && state.cats.length < config.cat.maxOnScreen) {
      const catSpawnChance = config.cat.spawnChance * state.dtFactor;
      if (random() < catSpawnChance) {
        spawnCat(state);
        state.lastCatSpawnTimestamp = now;
      }
    }

    // Spawn scaling: increase spawn rate with game speed to maintain density
    const spawnScale = state.dtFactor;
    const speedBonus = 1 + (state.gameSpeed - config.INITIAL_GAME_SPEED) * 0.15; // +15% per speed level
    const crystalSpawnChance = config.SPAWN_CRYSTAL_RATE * spawnScale * speedBonus * state.modifiers.spawnRateCrystal * comboScaling.spawnMultiplier;
    const meteorSpawnChance = config.SPAWN_METEOR_RATE * spawnScale * speedBonus * state.modifiers.spawnRateMeteor * comboScaling.spawnMultiplier;

    if (random() < crystalSpawnChance) spawnCrystal(state);
    if (random() < meteorSpawnChance && state.debug?.meteors) spawnMeteor(state);
    
    // Independent magnet spawning from the sky (affected by diminishing returns when active)
    const magnetSpawnRate = config.SPAWN_MAGNET_RATE * spawnScale * state.modifiers.spawnRateMagnet;
    if (random() < magnetSpawnRate) {
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
        const x = random() * (lw - 22); // 22 = pickup width
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
            ? styles[Math.floor(random() * styles.length)]
            : config.magnet.STYLE;
          
          spawnPowerUpPickup(state, 'magnet', x, spawnY, Math.max(3, state.gameSpeed * 1.2), style);
          state.lastMagnetSpawnTimestamp = now;
        }
      }
    }
    
    // Chain Lightning spawning (rarer than magnet, but exciting!)
    const chainLightningSpawnRate = config.SPAWN_CHAIN_LIGHTNING_RATE * spawnScale;
    if (random() < chainLightningSpawnRate) {
      const { MAX_POWERUP_PICKUPS, MIN_PICKUP_DISTANCE_X, PICKUP_DISTANCE_CHECK_Y } = config.spawning;

      // Only spawn if we have space and crystals on screen
      if (state.powerUpPickups.length < MAX_POWERUP_PICKUPS && state.crystals.length >= 3) {
        const x = random() * (lw - 22);
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
    if (random() < timeSlowSpawnRate) {
      const { MAX_POWERUP_PICKUPS, MIN_PICKUP_DISTANCE_X, PICKUP_DISTANCE_CHECK_Y } = config.spawning;

      if (state.powerUpPickups.length < MAX_POWERUP_PICKUPS) {
        const x = random() * (lw - 22);
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
            ? styles[Math.floor(random() * styles.length)]
            : config.TIME_SLOW_STYLE;
          
          spawnPowerUpPickup(state, 'time_slow', x, spawnY, Math.max(3, state.gameSpeed * 1.0), undefined, timeSlowStyle);
        }
      }
    }
  }

  const debugSeedEl = document.getElementById('debugSeed');
  const debugSeedSourceEl = document.getElementById('debugSeedSource');

  function showOracleForSeed(seed: RunSeedPayload) {
    restartGame(state, logicalWidth, logicalHeight, scoreElement, seed);
    pauseSystem.syncPauseButton();
    // analyzeRunSeed simulates the run then re-seeds PRNG to the start position
    state.oracleReading = analyzeRunSeed(seed);
    state.showingOracle = true;
    state.gameRunning = false; // hold until player dismisses the oracle
    if (debugSeedEl) debugSeedEl.textContent = seed.hex.slice(0, 8) + '…';
    if (debugSeedSourceEl) {
      debugSeedSourceEl.textContent = seed.isDailyRun ? '◈ daily' : seed.source === 'manual' ? '◈ manual' : seed.source;
    }
  }

  async function handleRestart() {
    // Manual seed override: skip fetching, reuse the same seed every restart so
    // the player can keep practicing the exact same run layout.
    if (seedOverride) {
      showOracleForSeed(seedOverride);
      return;
    }
    state._awaitingQuantumSeed = true;
    if (debugSeedEl) debugSeedEl.textContent = '…';
    if (debugSeedSourceEl) debugSeedSourceEl.textContent = '…';
    const seed = mode === 'daily'
      ? await getDailyChallengeSeed()
      : await fetchQuantumSeed();
    showOracleForSeed(seed);
  }

  // Setup initial player and canvas
  handleResize();
  const playerHeight = 30;
  const initialY = getInitialPlayerY(logicalHeight(), playerHeight, config.ENABLE_VERTICAL_MOVEMENT);
  state.player = { x: logicalWidth() / 2 - 25, y: initialY, width: 50, height: playerHeight, speed: config.PLAYER_SPEED, trail: [] };

  let lastTimestamp = performance.now();
  const debugEnabledRef = { current: state.debugEnabled ?? true };

  // Initialize debug panel
  const panel = document.getElementById('debugPanel');
  if (panel) {
    wireDebugPanelControls(state, debugControls, eventManager);
  }

  const debugKeyHandler = createDebugKeyHandler(
    state, 
    debugEnabledRef, 
    () => pauseSystem.togglePause(),
    debugControls
  );
  eventManager.addEventListener(document, 'keydown', debugKeyHandler);

  let lastFpsTimestamp = performance.now();

  // FPS limiter settings
  const targetFrameTime = config.TARGET_FPS > 0 ? 1000 / config.TARGET_FPS : 0;
  let frameAccumulator = 0;

  function formatRunTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `T I M E : ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

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

    if (!state.showingOracle) {
      update();
    }

    if (timerElement) timerElement.textContent = formatRunTime(state.runElapsedMs);

    // Scale animation time by game speed (slow-mo affects rotations, pulses, etc.)
    state.time += dtSeconds * state.modifiers.gameSpeed;

    // render via renderer module (canvas debug overlay disabled - use HTML panel instead)
    renderScene({ ...state, debugEnabled: false });

    if (state.showingOracle) {
      drawOracle(state);
    }
    
    // Update the external HTML debug panel
    if (panel) {
      updateDebugPanel(state, debugEnabledRef.current, debugControls);
    }
    
    requestAnimationFrame(gameLoop);
  }

  // Use state-driven restart request (set by input)
  // Guard _awaitingQuantumSeed so a second ENTER while fetching is ignored
  const restartKeyHandler = () => {
    if (state.showingOracle && state._restartRequested) {
      state._restartRequested = false;
      state.showingOracle = false;
      state.gameRunning = true;
      return;
    }
    if (!state.gameRunning && !state._awaitingQuantumSeed && state._restartRequested) {
      state._restartRequested = false;
      void handleRestart();
    }
  };
  eventManager.addEventListener(document, 'keydown', restartKeyHandler);

  // Copy seed to clipboard with 'C' on death screen
  const copySeedHandler = (e: Event) => {
    const ke = e as KeyboardEvent;
    if (!state.gameRunning && !state._awaitingQuantumSeed && state.runSeed
        && (ke.key === 'c' || ke.key === 'C') && !ke.ctrlKey && !ke.metaKey) {
      void navigator.clipboard.writeText(state.runSeed.hex).catch(() => undefined);
      state._seedCopied = true;
      setTimeout(() => { state._seedCopied = false; }, 1500);
    }
  };
  eventManager.addEventListener(document, 'keydown', copySeedHandler);

  // Wire resize event
  const resizeHandler = () => { requestAnimationFrame(handleResize); };
  eventManager.addEventListener(window, 'resize', resizeHandler);

  // Cleanup function to remove all event listeners
  function cleanup() {
    eventManager.cleanup();
  }

  // Store cleanup function in state for potential future use
  (state as GameState & { _cleanup?: () => void })._cleanup = cleanup;

  // Start the loop first so the "CONNECTING TO ANU QRNG..." screen renders
  // while the quantum fetch is in flight. restartGame() sets gameRunning=true.
  state.gameRunning = false;
  state._awaitingQuantumSeed = true;
  lastTimestamp = performance.now();
  requestAnimationFrame(gameLoop);
  void handleRestart();
}
