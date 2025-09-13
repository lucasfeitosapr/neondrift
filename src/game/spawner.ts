import { createCrystalEntity, createMeteorEntity } from './entities';

export function spawnCrystal(ctx: { crystals: any[]; canvas: HTMLCanvasElement; gameSpeed: number; score: number; }) {
  const c = createCrystalEntity(ctx.canvas, ctx.gameSpeed, ctx.score);
  ctx.crystals.push(c);
}

export function spawnMeteor(ctx: { meteors: any[]; canvas: HTMLCanvasElement; gameSpeed: number; }) {
  const m = createMeteorEntity(ctx.canvas, ctx.gameSpeed);
  ctx.meteors.push(m);
}
