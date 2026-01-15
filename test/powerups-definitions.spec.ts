import { describe, test, expect } from 'vitest';
import { getPowerUpDefinition } from '../src/game/powerups/definitions';
import { PowerUpId } from '../src/game/types';

describe('getPowerUpDefinition', () => {
  test('returns definition for valid powerup ID', () => {
    const def = getPowerUpDefinition('magnet');
    
    expect(def).toBeDefined();
    expect(def?.id).toBe('magnet');
    expect(def?.displayName).toBeDefined();
  });

  test('returns definition for time_slow', () => {
    const def = getPowerUpDefinition('time_slow');
    
    expect(def).toBeDefined();
    expect(def?.id).toBe('time_slow');
  });

  test('returns definition for chain_lightning', () => {
    const def = getPowerUpDefinition('chain_lightning');
    
    expect(def).toBeDefined();
    expect(def?.id).toBe('chain_lightning');
  });

  test('returns undefined for invalid powerup ID', () => {
    const def = getPowerUpDefinition('invalid_id' as PowerUpId);
    
    expect(def).toBeUndefined();
  });

  test('returns undefined for empty string', () => {
    const def = getPowerUpDefinition('' as PowerUpId);
    
    expect(def).toBeUndefined();
  });

  test('returns undefined for null-like value', () => {
    const def = getPowerUpDefinition(null as any);
    
    expect(def).toBeUndefined();
  });
});

describe('PowerUp Registry', () => {
  test('magnet powerup has required properties', () => {
    const def = getPowerUpDefinition('magnet');
    
    expect(def).toBeDefined();
    expect(def?.kind).toBe('buff');
    expect(def?.durationMs).toBeDefined();
    expect(def?.stacking).toBeDefined();
    expect(def?.maxStacks).toBeDefined();
    expect(def?.applyModifiers).toBeDefined();
  });

  test('time_slow powerup has required properties', () => {
    const def = getPowerUpDefinition('time_slow');
    
    expect(def).toBeDefined();
    expect(def?.kind).toBe('buff');
    expect(def?.durationMs).toBeDefined();
    expect(def?.stacking).toBeDefined();
    expect(def?.applyModifiers).toBeDefined();
  });

  test('chain_lightning powerup has required properties', () => {
    const def = getPowerUpDefinition('chain_lightning');
    
    expect(def).toBeDefined();
    expect(def?.kind).toBe('instant');
    expect(def?.onActivate).toBeDefined();
  });

  test('magnet powerup has optional callbacks', () => {
    const def = getPowerUpDefinition('magnet');
    
    expect(def).toBeDefined();
    // onActivate, onTick, onExpire are optional
    // Just verify they exist or are callable if defined
    if (def?.onActivate) {
      expect(typeof def.onActivate).toBe('function');
    }
    if (def?.onTick) {
      expect(typeof def.onTick).toBe('function');
    }
    if (def?.onExpire) {
      expect(typeof def.onExpire).toBe('function');
    }
  });

  test('powerup definitions have valid stacking modes', () => {
    const magnet = getPowerUpDefinition('magnet');
    const timeSlow = getPowerUpDefinition('time_slow');
    
    expect(magnet?.stacking).toBeDefined();
    expect(timeSlow?.stacking).toBeDefined();
    
    const validStackingModes = ['refresh', 'stack', 'extend', 'parallel'];
    if (magnet?.stacking) {
      expect(validStackingModes.includes(magnet.stacking)).toBe(true);
    }
    if (timeSlow?.stacking) {
      expect(validStackingModes.includes(timeSlow.stacking)).toBe(true);
    }
  });

  test('powerup definitions have valid kinds', () => {
    const magnet = getPowerUpDefinition('magnet');
    const chainLightning = getPowerUpDefinition('chain_lightning');
    
    expect(magnet?.kind).toBe('buff');
    expect(chainLightning?.kind).toBe('instant');
    
    const validKinds = ['buff', 'instant'];
    expect(validKinds.includes(magnet?.kind || '')).toBe(true);
    expect(validKinds.includes(chainLightning?.kind || '')).toBe(true);
  });

  test('buff powerups have durationMs', () => {
    const magnet = getPowerUpDefinition('magnet');
    const timeSlow = getPowerUpDefinition('time_slow');
    
    expect(magnet?.durationMs).toBeDefined();
    expect(timeSlow?.durationMs).toBeDefined();
    expect(magnet?.durationMs).toBeGreaterThan(0);
    expect(timeSlow?.durationMs).toBeGreaterThan(0);
  });

  test('instant powerups may not have durationMs', () => {
    const chainLightning = getPowerUpDefinition('chain_lightning');
    
    expect(chainLightning?.kind).toBe('instant');
    // Instant powerups might have durationMs = 0 or undefined
  });

  test('powerup definitions have displayName', () => {
    const magnet = getPowerUpDefinition('magnet');
    const timeSlow = getPowerUpDefinition('time_slow');
    const chainLightning = getPowerUpDefinition('chain_lightning');
    
    expect(magnet?.displayName).toBeDefined();
    expect(timeSlow?.displayName).toBeDefined();
    expect(chainLightning?.displayName).toBeDefined();
    expect(typeof magnet?.displayName).toBe('string');
    expect(typeof timeSlow?.displayName).toBe('string');
    expect(typeof chainLightning?.displayName).toBe('string');
  });

  test('powerup registry is complete', () => {
    const validIds: PowerUpId[] = ['magnet', 'time_slow', 'chain_lightning'];
    
    validIds.forEach(id => {
      const def = getPowerUpDefinition(id);
      expect(def).toBeDefined();
      expect(def?.id).toBe(id);
    });
  });

  test('handles powerup with missing optional callbacks gracefully', () => {
    // All powerups should work even if some callbacks are missing
    const magnet = getPowerUpDefinition('magnet');
    
    expect(magnet).toBeDefined();
    // applyModifiers should exist for buff powerups
    expect(magnet?.applyModifiers).toBeDefined();
  });

  test('powerup definitions have consistent structure', () => {
    const magnet = getPowerUpDefinition('magnet');
    
    expect(magnet).toBeDefined();
    expect(magnet?.id).toBe('magnet');
    expect(magnet?.displayName).toBeDefined();
    expect(magnet?.kind).toBeDefined();
    
    if (magnet?.kind === 'buff') {
      expect(magnet?.applyModifiers).toBeDefined();
    }
    
    if (magnet?.kind === 'instant') {
      expect(magnet?.onActivate).toBeDefined();
    }
  });
});
