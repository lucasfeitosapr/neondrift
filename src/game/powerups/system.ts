import { defaultModifiers } from '../state';
import { GameState, PowerUpInstance, PowerUpId } from '../types';
import { getPowerUpDefinition } from './definitions';

export function activatePowerUp(state: GameState, id: PowerUpId, now = performance.now()): PowerUpInstance | null {
  const def = getPowerUpDefinition(id);
  if (!def) return null;

  const durationMs = def.durationMs ?? 0;

  if (def.kind === 'instant') {
    const instance: PowerUpInstance = { id, startedAt: now, expiresAt: now, stacks: 1 };
    def.onActivate?.(state, instance, now);
    return instance;
  }

  const existingIndex = state.activePowerUps.findIndex((p: PowerUpInstance) => p.id === id);
  if (existingIndex >= 0 && def.stacking !== 'parallel') {
    const instance = state.activePowerUps[existingIndex];
    const max = def.maxStacks ?? 99;
    
    if (def.stacking === 'stack') {
      // Stack mode: increase stacks, reset timer
      instance.stacks = Math.min(max, instance.stacks + 1);
      instance.startedAt = now;
      instance.expiresAt = durationMs ? now + durationMs : undefined;
    } else if (def.stacking === 'extend') {
      // Extend mode: increase stacks, ADD duration to remaining time
      instance.stacks = Math.min(max, instance.stacks + 1);
      const remainingMs = instance.expiresAt ? Math.max(0, instance.expiresAt - now) : 0;
      instance.expiresAt = durationMs ? now + remainingMs + durationMs : undefined;
      // Don't reset startedAt - keep original start for UI purposes if needed
    } else {
      // Refresh mode: reset timer, keep stacks at 1
      instance.stacks = 1;
      instance.startedAt = now;
      instance.expiresAt = durationMs ? now + durationMs : undefined;
    }
    
    def.onActivate?.(state, instance, now);
    return instance;
  }

  const instance: PowerUpInstance = { id, startedAt: now, expiresAt: durationMs ? now + durationMs : undefined, stacks: 1 };
  def.onActivate?.(state, instance, now);
  state.activePowerUps.push(instance);
  return instance;
}

export function tickPowerUps(state: GameState, now = performance.now(), dtMs = 0): void {
  const next: PowerUpInstance[] = [];
  for (const instance of state.activePowerUps) {
    const def = getPowerUpDefinition(instance.id);
    if (!def) continue;
    if (instance.expiresAt !== undefined && now >= instance.expiresAt) {
      def.onExpire?.(state, instance, now);
      continue;
    }
    def.onTick?.(state, dtMs, instance, now);
    next.push(instance);
  }
  state.activePowerUps = next;

  state.modifiers = { ...defaultModifiers };
  for (const instance of state.activePowerUps) {
    const def = getPowerUpDefinition(instance.id);
    def?.applyModifiers?.(state.modifiers, state, instance);
  }
}
