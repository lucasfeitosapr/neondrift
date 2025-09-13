import { config } from './config';
import { initInput, keys } from './input';
import { Pool } from './pool';
import { renderScene } from './renderer';
import { spawnCrystal, spawnMeteor } from './spawner';

export function startGame(): void {
  // ...existing code migrated from neon_drift.html script section...
  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  const scoreElement = document.getElementById('score') as HTMLElement;
  const highScoreElement = document.getElementById('highScore') as HTMLElement;

  // Responsive resize handler: set canvas CSS size and logical size to a sensible range
  function resizeCanvas() {
    // keep some padding from the body
    const padding = 40; // accounts for body padding/margins
    // limit width so it doesn't grow too wide on large displays
    const cssWidth = Math.max(320, Math.min(400, window.innerWidth - padding));
    // increase vertical size by using a large fraction of available height, but within min/max
    const cssHeight = Math.max(600, Math.min(1200, Math.floor(window.innerHeight * 0.78)));

    // Apply CSS size
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;

    // Set logical canvas size to match CSS pixels so existing game math (which uses canvas.width/height)
    // continues to work without changing many places in the codebase.
    canvas.width = cssWidth;
    canvas.height = cssHeight;

    // Optional: keep a clean transform state
    try {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    } catch (e) { /* ignore if context lost */ }

    // If player exists, reposition to sensible default relative to new size
    if ((globalThis as any)._neondrift_player_ref) {
      const p = (globalThis as any)._neondrift_player_ref as any;
      p.x = Math.floor(canvas.width / 2 - p.width / 2);
      p.y = canvas.height - 60;
    }
  }

  // High score persistence
  let highScore = parseInt(localStorage.getItem('neondrift_highscore') || '0', 10) || 0;
  highScoreElement.textContent = `H I G H : ${highScore.toString().padStart(6, '0')}`;

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
  // try to connect once at start (will retry on first send if closed)
  let lastTelemetryTs = 0;
  function sendTelemetry(nowTs: number) {
    // ensure socket exists
    if (!telemetrySocket || telemetrySocket.readyState !== WebSocket.OPEN) {
      // attempt reconnect in background
      // try { connectTelemetrySocket(); } catch (e) { }
    }
    if (!telemetrySocket || telemetrySocket.readyState !== WebSocket.OPEN) return;
    // throttle to ~5Hz
    if (nowTs - lastTelemetryTs < 200) return;
    lastTelemetryTs = nowTs;
    try {
      const payload = {
        type: 'telemetry',
        fps: Math.round(fps),
        particles: particles.length,
        activeInputs: Object.keys(keys).filter(k => (keys as any)[k]),
        score
      };
      console.debug('[neondrift] sendTelemetry', payload);
      telemetrySocket!.send(JSON.stringify(payload));
    } catch (e) { console.warn('[neondrift] telemetry send failed', e); }
  }
  window.addEventListener('beforeunload', () => { console.log('[neondrift] closing telemetry socket'); try { telemetrySocket?.close(); } catch (e) {} });

  // Game state
  let score = 0;
  let gameRunning = true;
  let gameSpeed = config.INITIAL_GAME_SPEED;
  let time = 0;
  let dtFactor = 1; // frame-normalized multiplier (dt * 60)

  // Player will be created after the first resize so positioning uses the current canvas size
  let player: any = null;

  // Arrays for game objects
  const crystals: any[] = [];
  const meteors: any[] = [];
  const gridLines: any[] = [];
  const particles: any[] = []; // active particles
  const MAX_PARTICLES = config.PARTICLE_POOL_SIZE;
  const particlePool = new Pool(() => ({ active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, decay: 0, size: 1, color: '0,255,255' }), MAX_PARTICLES);

  // store a global ref so the resize handler can update the player without altering many call sites
  (globalThis as any)._neondrift_player_ref = player;

  // Combo engine state
  let lastCollectTimestamp = 0; // ms since epoch
  let comboCount = 0;
  const comboTimeout = config.COMBO_TIMEOUT; // ms
  const maxCombo = config.MAX_COMBO; // cap multiplier

  // Floating score texts (small visual HUD elements)
  const floatingTexts: { x: number; y: number; text: string; life: number; color?: string; vy: number }[] = [];

  function createFloatingText(x: number, y: number, text: string, color = '#00ffff') {
    floatingTexts.push({ x, y, text, life: 1, color, vy: -0.3 - Math.random() * 0.4 });
  }

  function drawFloatingTexts() {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ft.x += 0; // could add sway
      ft.y += ft.vy * dtFactor;
      ft.life -= 0.02 * dtFactor;
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.life);
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 12 * ft.life;
      ctx.fillStyle = ft.color;
      ctx.font = 'bold 14px Orbitron';
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
      if (ft.life <= 0) floatingTexts.splice(i, 1);
    }
  }

  // Initialize grid
  for (let i = 0; i < 20; i++) {
    gridLines.push({
      y: i * 30,
      opacity: Math.random() * 0.5 + 0.1
    });
  }

  // Input handling (moved to module)
  initInput();

  // run initial resize and create player now that canvas size is known
  resizeCanvas();

  // create player now that canvas dimensions are set
  player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 60,
    width: 50,
    height: 30,
    speed: 6,
    trail: [] as any[]
  };
  (globalThis as any)._neondrift_player_ref = player;

  // createCrystal / createMeteor moved to spawner module

  function spawnParticleFromPool(x: number, y: number, vx: number, vy: number, life: number, decay: number, size: number, color: string | null, colorType: string, hueOffset?: number) {
    const p = particlePool.borrow() as any;
    p.active = true;
    p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.life = life; p.decay = decay; p.size = size;
    if (colorType === 'rainbow') {
      p.colorType = 'rainbow'; p.hueOffset = hueOffset || 0; p.color = null;
    } else {
      p.colorType = 'rgb'; p.color = color; p.hueOffset = 0;
    }
    particles.push(p);
    return p;
  }

  function createParticle(x: number, y: number, color: string | 'rainbow') {
    if (color === 'rainbow') {
      for (let i = 0; i < 16; i++) {
        const vx = (Math.random() - 0.5) * 8;
        const vy = (Math.random() - 0.5) * 8;
        const life = 1;
        const decay = 0.04;
        const size = Math.random() * 4 + 1.5;
        spawnParticleFromPool(x, y, vx, vy, life, decay, size, null, 'rainbow', Math.random() * 360);
      }
    } else {
      for (let i = 0; i < 10; i++) {
        const vx = (Math.random() - 0.5) * 6;
        const vy = (Math.random() - 0.5) * 6;
        const life = 1;
        const decay = 0.03;
        const size = Math.random() * 3 + 1.5;
        spawnParticleFromPool(x, y, vx, vy, life, decay, size, color as string, 'rgb', 0);
      }
    }
  }

  // Draw functions (copying logic from original)
  function drawGrid() {
    time += 0.02;
    ctx.strokeStyle = 'rgba(255, 0, 255, 0.15)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    gridLines.forEach(line => {
      line.y += gameSpeed * 0.5;
      if (line.y > canvas.height + 30) { line.y = -30; line.opacity = Math.random() * 0.5 + 0.1; }
      ctx.strokeStyle = `rgba(0, 255, 255, ${line.opacity})`;
      ctx.beginPath(); ctx.moveTo(0, line.y); ctx.lineTo(canvas.width, line.y); ctx.stroke();
    });
  }

  function drawPlayer() {
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
      const hue = (time * 120 + crystal.hueOffset) % 360; mainColor = `hsl(${hue}, 100%, 60%)`; shadowColor = mainColor;
    }
    ctx.shadowColor = shadowColor; ctx.shadowBlur = 20 * crystal.glow;
    ctx.fillStyle = mainColor; ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(8, 0); ctx.lineTo(0, 12); ctx.lineTo(-8, 0); ctx.closePath(); ctx.fill();
    let innerColor = '#ffffff'; if (crystal.type.color === 'rainbow') { const hueInner = (time * 120 + crystal.hueOffset + 45) % 360; innerColor = `hsl(${hueInner}, 100%, 70%)`; }
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
    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i];
      particle.x += particle.vx * dtFactor; particle.y += particle.vy * dtFactor; particle.life -= particle.decay * dtFactor;
      if (particle.life <= 0) {
        particle.active = false;
        particlePool.release(particle);
        particles.splice(i, 1);
        continue;
      }
      if (particle.colorType === 'rainbow') { const hue = (time * 160 + particle.hueOffset) % 360; ctx.fillStyle = `hsla(${hue}, 100%, 60%, ${particle.life})`; } else { ctx.fillStyle = `rgba(${particle.color}, ${particle.life})`; }
      ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
    }
  }

  function checkCollision(obj1: any, obj2: any) {
    return obj1.x < obj2.x + obj2.width && obj1.x + obj1.width > obj2.x && obj1.y < obj2.y + obj2.height && obj1.y + obj1.height > obj2.y;
  }

  function update() {
    if (!gameRunning) return;
    const moveAmount = player.speed * dtFactor;
    if ((keys['arrowleft'] || keys['a']) && player.x > 0) { player.x -= moveAmount; if (player.x < 0) player.x = 0; }
    if ((keys['arrowright'] || keys['d']) && player.x < canvas.width - player.width) { player.x += moveAmount; if (player.x > canvas.width - player.width) player.x = canvas.width - player.width; }

    for (let i = crystals.length - 1; i >= 0; i--) {
      crystals[i].y += crystals[i].speed * dtFactor; crystals[i].glow = Math.sin(time * 3) * 0.3 + 0.7;
      if (checkCollision(player, crystals[i])) {
        // Combo detection
        const now = performance.now();
        if (now - lastCollectTimestamp <= comboTimeout) {
          comboCount = Math.min(maxCombo, comboCount + 1);
        } else {
          comboCount = 1;
        }
        lastCollectTimestamp = now;

        // Multiplier: 1.0 + 0.5 per extra combo (e.g., x2 at comboCount=3)
        const multiplier = 1 + Math.max(0, comboCount - 1) * 0.5;
        const basePoints = crystals[i].type.points;
        const pointsAwarded = Math.floor(basePoints * multiplier);
        score += pointsAwarded;

        // Visuals: particles + floating score + combo flash
        let particleColor: any;
        switch(crystals[i].type.color) { case 'purple': particleColor = '170, 0, 255'; break; case 'gold': particleColor = '255, 170, 0'; break; case 'rainbow': particleColor = 'rainbow'; break; default: particleColor = '0, 255, 255'; }
        createParticle(crystals[i].x + crystals[i].width/2, crystals[i].y + crystals[i].height/2, particleColor);
        // floating score near the crystal
        createFloatingText(crystals[i].x + crystals[i].width/2, crystals[i].y, `+${pointsAwarded}`, '#00ffff');
        if (comboCount > 1) createFloatingText(player.x + player.width/2, player.y - 10, `x${comboCount}`, '#ff00ff');

        crystals.splice(i, 1);
        scoreElement.textContent = `S C O R E : ${score.toString().padStart(6, '0')}`;
        if (score % 100 === 0) { gameSpeed += 0.5; }
        if (score > highScore) { highScore = score; try { localStorage.setItem('neondrift_highscore', String(highScore)); } catch (e) { } highScoreElement.textContent = `H I G H : ${highScore.toString().padStart(6, '0')}`; }
      } else if (crystals[i] && crystals[i].y > canvas.height) { crystals.splice(i, 1); }
    }

    for (let i = meteors.length - 1; i >= 0; i--) {
      meteors[i].y += meteors[i].speed * dtFactor;
      if (checkCollision(player, meteors[i])) { gameRunning = false; createParticle(player.x + player.width/2, player.y + player.height/2, '255, 0, 255'); return; }
      else if (meteors[i] && meteors[i].y > canvas.height) { meteors.splice(i, 1); }
    }

    const spawnScale = dtFactor;
    if (Math.random() < config.SPAWN_CRYSTAL_RATE * spawnScale) spawnCrystal({ crystals, canvas, gameSpeed, score });
    if (Math.random() < config.SPAWN_METEOR_RATE * spawnScale) spawnMeteor({ meteors, canvas, gameSpeed });
  }

  function restartGame() {
    score = 0; gameSpeed = config.INITIAL_GAME_SPEED; gameRunning = true; crystals.length = 0; meteors.length = 0; particles.length = 0; player.x = canvas.width / 2 - 25; player.trail = [];
    floatingTexts.length = 0; comboCount = 0; lastCollectTimestamp = 0;
    scoreElement.textContent = `S C O R E : ${score.toString().padStart(6, '0')}`;
  }

  let lastTimestamp = performance.now();
  let fps = 60;
  let debugEnabled = true;
  const debugFlags = { grid: true, boxes: false, particles: true };

  // toggle debug overlay with backquote (`) or tilde (~)
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
    dtFactor = dtSeconds * 60;
    time += dtSeconds;

    // FPS calc
    const now = performance.now();
    const frameDt = now - lastFpsTimestamp;
    fps = 1000 / Math.max(1, frameDt);
    lastFpsTimestamp = now;

    // update
    update();

    // render via renderer module
    renderScene({ ctx, canvas, time, gameSpeed, player, crystals, meteors, particles, dtFactor, floatingTexts, score, highScore, gameRunning, gridLines, particlePool, fps, debugEnabled, debug: debugFlags });

    requestAnimationFrame(gameLoop);
  }

  document.addEventListener('keydown', (e) => { if (!gameRunning) { restartGame(); } });

  restartGame(); lastTimestamp = performance.now(); requestAnimationFrame(gameLoop);
}
