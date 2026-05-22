import { GameState } from '../types';
import { OracleReading } from '../oracle';

function drawDivider(ctx: CanvasRenderingContext2D, x1: number, x2: number, y: number): void {
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.strokeStyle = 'rgba(0, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawScoreBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  score: number,
  colorHigh: string,
  colorMid: string
): void {
  const segW = 10;
  const segH = 7;
  const gap = 2;
  for (let i = 0; i < 10; i++) {
    if (i < score) {
      ctx.fillStyle = i >= 7 ? colorHigh : colorMid;
      ctx.shadowColor = colorHigh;
      ctx.shadowBlur = i >= 7 ? 8 : 3;
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.07)';
      ctx.shadowBlur = 0;
    }
    ctx.fillRect(x + i * (segW + gap), y - segH, segW, segH);
  }
  ctx.shadowBlur = 0;
}

function drawPowerUpRow(
  ctx: CanvasRenderingContext2D,
  label: string,
  t: number | null,
  color: string,
  x1: number,
  x2: number,
  y: number
): void {
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.shadowBlur = 0;
  ctx.fillText(label, x1, y);
  ctx.textAlign = 'right';
  if (t === null) {
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillText('—', x2, y);
  } else {
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.fillText(`~${Math.floor(t)}s`, x2, y);
    ctx.shadowBlur = 0;
  }
}

export function drawOracle(state: GameState): void {
  const oracle = state.oracleReading as OracleReading | undefined;
  if (!oracle) return;

  const { ctx } = state;
  const lw = state.viewport?.width ?? state.canvas.width;
  const lh = state.viewport?.height ?? state.canvas.height;
  const cx = lw / 2;
  const hasDanger = oracle.dangerPeakAt !== null;

  // Card height derived from content (danger row is optional)
  const cardH = hasDanger ? 268 : 250;
  const cardX = 16;
  const cardY = Math.floor(lh / 2 - cardH / 2);
  const cardW = lw - 32;
  const x1 = cardX + 10;
  const x2 = cardX + cardW - 10;
  // Bar centered horizontally: 10 segs × 10px + 9 gaps × 2px = 118px
  const barX = cx - 59;

  ctx.save();

  // Background overlay
  ctx.fillStyle = 'rgba(2, 0, 18, 0.88)';
  ctx.fillRect(0, 0, lw, lh);

  // Card background
  ctx.fillStyle = 'rgba(0, 15, 35, 0.75)';
  ctx.fillRect(cardX, cardY, cardW, cardH);
  ctx.strokeStyle = 'rgba(0, 255, 255, 0.18)';
  ctx.lineWidth = 1;
  ctx.strokeRect(cardX, cardY, cardW, cardH);

  let y = cardY + 28;

  // ── Title ─────────────────────────────────────────────────────
  ctx.textAlign = 'center';
  ctx.font = 'bold 13px Orbitron';
  ctx.fillStyle = '#00ffff';
  ctx.shadowColor = '#00ffff';
  ctx.shadowBlur = 16;
  ctx.fillText('◈  Q U A N T U M  A N A L Y S I S  ◈', cx, y);
  y += 17;

  // ── Seed line ─────────────────────────────────────────────────
  ctx.shadowBlur = 0;
  ctx.font = '8px Orbitron';
  ctx.fillStyle = 'rgba(0, 255, 255, 0.38)';
  if (state.runSeed) {
    const { hex, source, isDailyRun } = state.runSeed;
    const abbrev = hex.slice(0, 4) + '...' + hex.slice(-4);
    const src = isDailyRun ? 'DAILY · ANU QRNG'
      : source === 'quantum' ? 'ANU QRNG'
      : source === 'manual' ? 'MANUAL SEED'
      : 'LOCAL ENTROPY';
    ctx.fillText(`SEED: ${abbrev}  ·  ${src}`, cx, y);
  }
  y += 14;
  drawDivider(ctx, cardX, cardX + cardW, y); y += 16;

  // ── Crystal bar ───────────────────────────────────────────────
  ctx.font = 'bold 9px Orbitron';
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(0, 255, 255, 0.75)';
  ctx.shadowColor = '#00ffff';
  ctx.shadowBlur = 5;
  ctx.fillText('CRYSTALS', x1, y);
  ctx.shadowBlur = 0;
  drawScoreBar(ctx, barX, y, oracle.crystalScore, '#00ffff', '#4af7ff');
  ctx.textAlign = 'right';
  const cColor = oracle.crystalLabel === 'DENSE' ? '#00ffff'
    : oracle.crystalLabel === 'SPARSE' ? '#c59bff'
    : 'rgba(255,255,255,0.38)';
  ctx.fillStyle = cColor;
  ctx.shadowColor = cColor;
  ctx.shadowBlur = oracle.crystalLabel !== 'NORMAL' ? 7 : 0;
  ctx.fillText(oracle.crystalLabel, x2, y);
  ctx.shadowBlur = 0;
  y += 20;

  // ── Meteor bar ────────────────────────────────────────────────
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255, 100, 0, 0.8)';
  ctx.shadowColor = '#ff6600';
  ctx.shadowBlur = 5;
  ctx.fillText('METEORS', x1, y);
  ctx.shadowBlur = 0;
  drawScoreBar(ctx, barX, y, oracle.meteorScore, '#ff3300', '#ff8800');
  ctx.textAlign = 'right';
  const mColor = oracle.meteorLabel === 'INTENSE' ? '#ff3300'
    : oracle.meteorLabel === 'CALM' ? '#00ffaa'
    : 'rgba(255,255,255,0.38)';
  ctx.fillStyle = mColor;
  ctx.shadowColor = mColor;
  ctx.shadowBlur = oracle.meteorLabel !== 'MODERATE' ? 7 : 0;
  ctx.fillText(oracle.meteorLabel, x2, y);
  ctx.shadowBlur = 0;
  y += 16;
  drawDivider(ctx, cardX, cardX + cardW, y); y += 14;

  // ── Power-up first appearances ────────────────────────────────
  ctx.font = '9px Orbitron';
  drawPowerUpRow(ctx, 'FIRST MAGNET', oracle.firstMagnetAt, '#7ce7ff', x1, x2, y); y += 17;
  drawPowerUpRow(ctx, 'CHAIN LIGHTNING', oracle.firstLightningAt, '#ffd166', x1, x2, y); y += 17;
  drawPowerUpRow(ctx, 'TIME SLOW', oracle.firstTimeSlowAt, '#c59bff', x1, x2, y); y += 17;
  drawDivider(ctx, cardX, cardX + cardW, y); y += 13;

  // ── Spawn bias ────────────────────────────────────────────────
  const bias = oracle.leftBias;
  const biasText = bias < 0.45 ? '◄◄ LEFT' : bias > 0.55 ? 'RIGHT ►►' : 'BALANCED';
  const biasColor = bias < 0.45 ? '#7ce7ff' : bias > 0.55 ? '#c59bff' : 'rgba(255,255,255,0.38)';
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,255,255,0.38)';
  ctx.fillText('SPAWN BIAS', x1, y);
  ctx.textAlign = 'right';
  ctx.fillStyle = biasColor;
  ctx.shadowColor = biasColor;
  ctx.shadowBlur = (bias < 0.45 || bias > 0.55) ? 8 : 0;
  ctx.fillText(biasText, x2, y);
  ctx.shadowBlur = 0;
  y += 17;

  // ── Danger peak (optional) ────────────────────────────────────
  if (hasDanger) {
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,0.38)';
    ctx.fillText('DANGER PEAK', x1, y);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ff3300';
    ctx.shadowColor = '#ff3300';
    ctx.shadowBlur = 12;
    ctx.fillText(`~${oracle.dangerPeakAt}s`, x2, y);
    ctx.shadowBlur = 0;
    y += 17;
  }

  drawDivider(ctx, cardX, cardX + cardW, y); y += 21;

  // ── Press ENTER (pulsing) ─────────────────────────────────────
  const pulse = Math.sin(Date.now() / 400) * 0.25 + 0.75;
  ctx.globalAlpha = pulse;
  ctx.textAlign = 'center';
  ctx.font = 'bold 12px Orbitron';
  ctx.fillStyle = '#00ffff';
  ctx.shadowColor = '#00ffff';
  ctx.shadowBlur = 16;
  ctx.fillText('PRESS ENTER TO BEGIN', cx, y);
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;

  ctx.restore();
}
