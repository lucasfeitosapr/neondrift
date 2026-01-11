import { config } from './config';
import { initInput, keys } from './input';
import { Pool } from './pool';
import { renderScene } from './renderer';
import { spawnCrystal, spawnMeteor } from './spawner';
import { GameState } from './types';
import { createState } from './state';

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

  // Telemetry WebSocket for CodeCircuit (fallback to WebSocket instead of BroadcastChannel)
  const TELEMETRY_WS_URL = (window.location.hostname === 'localhost') ? 'ws://localhost:8964' : `ws://${window.location.host.replace(/:\d+$/, ':8964')}`;
  let telemetrySocket: WebSocket | null = null;
  function connectTelemetrySocket() {
    try {
      telemetrySocket = new WebSocket(TELEMETRY_WS_URL);
      telemetrySocket.addEventListener('open', () => console.log('[neondrift] telemetry ws open ->', TELEMETRY_WS_URL));
      telemetrySocket.addEventListener('close', () => console.log('[neondrift] telemetry ws closed'));
      telemetrySocket.addEventListener('error', (e) => console.warn('[neondrift] telemetry ws error', e));
    } catch (e) { telemetrySocket = null; console.warn('[neondrift] telemetry connect failed', e); }
  }
  let lastTelemetryTs = 0;
  function sendTelemetry(nowTs: number) {
    if (!telemetrySocket || telemetrySocket.readyState !== WebSocket.OPEN) {
      // attempt reconnect in background if needed
    }
    if (!telemetrySocket || telemetrySocket.readyState !== WebSocket.OPEN) return;
    if (nowTs - lastTelemetryTs < 200) return;
    lastTelemetryTs = nowTs;
    try {
      const payload = {
        type: 'telemetry',
        fps: Math.round(state.fps),
        particles: state.particles.length,
        activeInputs: Object.keys(keys).filter(k => (keys as any)[k]),
        score: state.score
      };
      console.debug('[neondrift] sendTelemetry', payload);
      telemetrySocket!.send(JSON.stringify(payload));
    } catch (e) { console.warn('[neondrift] telemetry send failed', e); }
  }
  window.addEventListener('beforeunload', () => { console.log('[neondrift] closing telemetry socket'); try { telemetrySocket?.close(); } catch (e) {} });

  // Floating score texts
  function createFloatingText(x: number, y: number, text: string, color = '#00ffff') {
    state.floatingTexts.push({ x, y, text, life: 1, color, vy: -0.3 - Math.random() * 0.4 });
  }

  function drawFloatingTexts() {
    for (let i = state.floatingTexts.length - 1; i >= 0; i--) {
      const ft = state.floatingTexts[i];
      ft.x += 0;
      ft.y += ft.vy * state.dtFactor;
      ft.life -= 0.02 * state.dtFactor;
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.life);
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 12 * ft.life;
      ctx.fillStyle = ft.color;
      ctx.font = 'bold 14px Orbitron';
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
      if (ft.life <= 0) state.floatingTexts.splice(i, 1);
    }
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
    const cssWidth = Math.max(320, Math.min(900, window.innerWidth - padding));
    const cssHeight = Math.max(600, Math.min(1200, Math.floor(window.innerHeight * 0.78)));
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
      state.player.y = logicalHeight() - 60;
    }
  }

  // spawn / particle helpers using state
  function spawnParticleFromPool(x: number, y: number, vx: number, vy: number, life: number, decay: number, size: number, color: string | null, colorType: string, hueOffset?: number) {
    const p = state.particlePool.borrow() as any;
    p.active = true;
    p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.life = life; p.decay = decay; p.size = size;
    if (colorType === 'rainbow') { p.colorType = 'rainbow'; p.hueOffset = hueOffset || 0; p.color = null; }
    else { p.colorType = 'rgb'; p.color = color; p.hueOffset = 0; }
    state.particles.push(p);
    return p;
  }

  function createParticle(x: number, y: number, color: string | 'rainbow') {
    if (color === 'rainbow') {
      for (let i = 0; i < 16; i++) {
        const vx = (Math.random() - 0.5) * 8;
        const vy = (Math.random() - 0.5) * 8;
        spawnParticleFromPool(x, y, vx, vy, 1, 0.04, Math.random() * 4 + 1.5, null, 'rainbow', Math.random() * 360);
      }
    } else {
      for (let i = 0; i < 10; i++) {
        const vx = (Math.random() - 0.5) * 6;
        const vy = (Math.random() - 0.5) * 6;
        spawnParticleFromPool(x, y, vx, vy, 1, 0.03, Math.random() * 3 + 1.5, color as string, 'rgb', 0);
      }
    }
  }

  // draw / update functions now operate on state
  function drawGrid() {
    state.time += 0.02;
    ctx.strokeStyle = 'rgba(255, 0, 255, 0.15)';
    ctx.lineWidth = 1;
    const lw = logicalWidth();
    const lh = logicalHeight();
    for (let x = 0; x < lw; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, lh); ctx.stroke(); }
    state.gridLines.forEach((line: any) => {
      line.y += state.gameSpeed * 0.5;
      if (line.y > lh + 30) { line.y = -30; line.opacity = Math.random() * 0.5 + 0.1; }
      ctx.strokeStyle = `rgba(0, 255, 255, ${line.opacity})`;
      ctx.beginPath(); ctx.moveTo(0, line.y); ctx.lineTo(lw, line.y); ctx.stroke();
    });
  }

  function drawPlayer() {
    const player = state.player;
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
  }

  function drawCrystal(crystal: any) {
    crystal.rotation += 0.1;
    ctx.save(); ctx.translate(crystal.x + crystal.width/2, crystal.y + crystal.height/2); ctx.rotate(crystal.rotation);
    let mainColor = crystal.type.colorHex || '#00ffff'; let shadowColor = mainColor;
    if (crystal.type.color === 'rainbow') {
      const hue = (state.time * 120 + crystal.hueOffset) % 360; mainColor = `hsl(${hue}, 100%, 60%)`; shadowColor = mainColor;
    }
    ctx.shadowColor = shadowColor; ctx.shadowBlur = 20 * crystal.glow;
    ctx.fillStyle = mainColor; ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(8, 0); ctx.lineTo(0, 12); ctx.lineTo(-8, 0); ctx.closePath(); ctx.fill();
    let innerColor = '#ffffff'; if (crystal.type.color === 'rainbow') { const hueInner = (state.time * 120 + crystal.hueOffset + 45) % 360; innerColor = `hsl(${hueInner}, 100%, 70%)`; }
    ctx.fillStyle = innerColor; ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(4, 0); ctx.lineTo(0, 6); ctx.lineTo(-4, 0); ctx.closePath(); ctx.fill();
    ctx.restore(); ctx.shadowBlur = 0;
  }

  function drawMeteor(meteor: any) {
    meteor.rotation += 0.05; meteor.pulse += 0.1;
    ctx.save(); ctx.translate(meteor.x + meteor.width/2, meteor.y + meteor.height/2); ctx.rotate(meteor.rotation);
    const glowIntensity = Math.sin(meteor.pulse) * 0.3 + 0.7; ctx.shadowColor = '#ff00ff'; ctx.shadowBlur = 25 * glowIntensity;
    ctx.fillStyle = '#ff00ff'; ctx.fillRect(-15, -15, 30, 30);
    ctx.fillStyle = '#ff6666'; ctx.fillRect(-8, -8, 16, 16);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-10, -10); ctx.lineTo(10, 10); ctx.moveTo(10, -10); ctx.lineTo(-10, 10); ctx.stroke();
    ctx.restore(); ctx.shadowBlur = 0;
  }

  function drawParticles() {
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const particle = state.particles[i];
      particle.x += particle.vx * state.dtFactor; particle.y += particle.vy * state.dtFactor; particle.life -= particle.decay * state.dtFactor;
      if (particle.life <= 0) {
        particle.active = false; state.particlePool.release(particle); state.particles.splice(i, 1); continue;
      }
      if (particle.colorType === 'rainbow') { const hue = (state.time * 160 + particle.hueOffset) % 360; ctx.fillStyle = `hsla(${hue}, 100%, 60%, ${particle.life})`; } else { ctx.fillStyle = `rgba(${particle.color}, ${particle.life})`; }
      ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
    }
  }

  function checkCollision(obj1: any, obj2: any) {
    return obj1.x < obj2.x + obj2.width && obj1.x + obj1.width > obj2.x && obj1.y < obj2.y + obj2.height && obj1.y + obj1.height > obj2.y;
  }

  function update() {
    if (!state.gameRunning) return;
    const moveAmount = state.player.speed * state.dtFactor;
    const lw = logicalWidth();
    if ((keys['arrowleft'] || keys['a']) && state.player.x > 0) { state.player.x -= moveAmount; if (state.player.x < 0) state.player.x = 0; }
    if ((keys['arrowright'] || keys['d']) && state.player.x < lw - state.player.width) { state.player.x += moveAmount; if (state.player.x > lw - state.player.width) state.player.x = lw - state.player.width; }

    for (let i = state.crystals.length - 1; i >= 0; i--) {
      state.crystals[i].y += state.crystals[i].speed * state.dtFactor; state.crystals[i].glow = Math.sin(state.time * 3) * 0.3 + 0.7;
      if (checkCollision(state.player, state.crystals[i])) {
        const now = performance.now();
        if (now - state.lastCollectTimestamp <= config.COMBO_TIMEOUT) { state.comboCount = Math.min(config.MAX_COMBO, state.comboCount + 1); } else { state.comboCount = 1; }
        state.lastCollectTimestamp = now;
        const multiplier = 1 + Math.max(0, state.comboCount - 1) * 0.5;
        const basePoints = state.crystals[i].type.points;
        const pointsAwarded = Math.floor(basePoints * multiplier);
        state.score += pointsAwarded;

        let particleColor: any;
        switch(state.crystals[i].type.color) { case 'purple': particleColor = '170, 0, 255'; break; case 'gold': particleColor = '255, 170, 0'; break; case 'rainbow': particleColor = 'rainbow'; break; default: particleColor = '0, 255, 255'; }
        createParticle(state.crystals[i].x + state.crystals[i].width/2, state.crystals[i].y + state.crystals[i].height/2, particleColor);
        createFloatingText(state.crystals[i].x + state.crystals[i].width/2, state.crystals[i].y, `+${pointsAwarded}`, '#00ffff');
        if (state.comboCount > 1) createFloatingText(state.player.x + state.player.width/2, state.player.y - 10, `x${state.comboCount}`, '#ff00ff');

        state.crystals.splice(i, 1);
        scoreElement.textContent = `S C O R E : ${state.score.toString().padStart(6, '0')}`;
        if (state.score % 100 === 0) { state.gameSpeed += 0.5; }
        if (state.score > state.highScore) { state.highScore = state.score; try { localStorage.setItem('neondrift_highscore', String(state.highScore)); } catch (e) { } highScoreElement.textContent = `H I G H : ${state.highScore.toString().padStart(6, '0')}`; }
      } else if (state.crystals[i] && state.crystals[i].y > logicalHeight()) { state.crystals.splice(i, 1); }
    }

    for (let i = state.meteors.length - 1; i >= 0; i--) {
      state.meteors[i].y += state.meteors[i].speed * state.dtFactor;
      if (checkCollision(state.player, state.meteors[i])) { state.gameRunning = false; createParticle(state.player.x + state.player.width/2, state.player.y + state.player.height/2, '255, 0, 255'); return; }
      else if (state.meteors[i] && state.meteors[i].y > logicalHeight()) { state.meteors.splice(i, 1); }
    }

    const spawnScale = state.dtFactor;
    if (Math.random() < config.SPAWN_CRYSTAL_RATE * spawnScale) spawnCrystal(state);
    if (Math.random() < config.SPAWN_METEOR_RATE * spawnScale) spawnMeteor(state);
  }

  function restartGame() {
    state.score = 0; state.gameSpeed = config.INITIAL_GAME_SPEED; state.gameRunning = true; state.crystals.length = 0; state.meteors.length = 0; state.particles.length = 0; state.player.x = logicalWidth() / 2 - 25; state.player.trail = [];
    state.floatingTexts.length = 0; state.comboCount = 0; state.lastCollectTimestamp = 0;
    scoreElement.textContent = `S C O R E : ${state.score.toString().padStart(6, '0')}`;
  }

  // setup initial player and canvas
  resizeCanvas();
  state.player = { x: logicalWidth() / 2 - 25, y: logicalHeight() - 60, width: 50, height: 30, speed: 6, trail: [] };

  let lastTimestamp = performance.now();
  let fps = 60;
  let debugEnabled = true;
  const debugFlags = { grid: true, boxes: false, particles: true };

  document.addEventListener('keydown', (e) => {
    if (e.key === '`' || e.key === '~') debugEnabled = !debugEnabled;
    if (e.key.toLowerCase() === 'g') debugFlags.grid = !debugFlags.grid;
    if (e.key.toLowerCase() === 'b') debugFlags.boxes = !debugFlags.boxes;
    if (e.key.toLowerCase() === 'p') debugFlags.particles = !debugFlags.particles;
  });

  let lastFpsTimestamp = performance.now();
  let fpsAccumulator = 0;

  function gameLoop(timestamp: number) {
    const dtSeconds = Math.min((timestamp - lastTimestamp) / 1000, 0.05);
    lastTimestamp = timestamp;
    state.dtFactor = dtSeconds * 60;
    state.time += dtSeconds;

    const now = performance.now();
    const frameDt = now - lastFpsTimestamp;
    state.fps = 1000 / Math.max(1, frameDt);
    lastFpsTimestamp = now;

    update();

    // render via renderer module (pass the whole state)
    renderScene(Object.assign({ debugEnabled }, state));

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
