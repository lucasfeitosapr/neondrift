import { GameState } from '../types';
import { config } from '../config';
import {
  getDifficultyLevel,
  getDifficultyPercent,
  getMaxDifficultyLevel
} from '../scoring';
import { activateRainbowRain } from '../events/rainbowRain';

export type ControlType = 'display' | 'toggle' | 'numeric' | 'custom';

export interface BaseControl {
  id: string;
  type: ControlType;
  label: string;
  section?: string; // Groups controls (e.g., "Crystal Flags")
  elementId?: string; // Custom element ID (defaults to `debug${id}` or `status${id}`)
}

export interface DisplayControl extends BaseControl {
  type: 'display';
  getValue: (state: GameState) => string | number;
  format?: (value: any) => string;
}

export interface ToggleControl extends BaseControl {
  type: 'toggle';
  key?: string; // Keyboard shortcut
  getValue: (state: GameState) => boolean;
  setValue: (state: GameState, value: boolean) => void;
  statusElementId?: string; // Element ID for status display (defaults to `status${id}`)
}

export interface NumericControl extends BaseControl {
  type: 'numeric';
  getValue: (state: GameState) => number;
  setValue: (state: GameState, value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  valueElementId?: string; // Element ID for value display
  decButtonId?: string; // Element ID for decrease button
  incButtonId?: string; // Element ID for increase button
}

export interface CustomControl extends BaseControl {
  type: 'custom';
  render: (state: GameState, elements: Map<string, HTMLElement>) => void;
  elementIds?: string[]; // List of element IDs this control needs
}

export type DebugControl = DisplayControl | ToggleControl | NumericControl | CustomControl;

export const debugControls: DebugControl[] = [
  // Display controls
  {
    id: 'fps',
    type: 'display',
    label: 'FPS',
    elementId: 'debugFps',
    getValue: (state) => Math.round(state.fps || 60)
  },
  {
    id: 'dt',
    type: 'display',
    label: 'dtFactor',
    elementId: 'debugDt',
    getValue: (state) => state.dtFactor,
    format: (v) => v.toFixed(2)
  },
  {
    id: 'particles',
    type: 'display',
    label: 'Particles',
    elementId: 'debugParticles',
    getValue: (state) => state.particles.length
  },
  {
    id: 'speed',
    type: 'display',
    label: 'Speed',
    elementId: 'debugSpeed',
    getValue: (state) => state.gameSpeed,
    format: (v) => v.toFixed(2)
  },
  {
    id: 'crystals',
    type: 'display',
    label: 'Crystals',
    elementId: 'debugCrystals',
    getValue: (state) => state.crystals.length,
    format: (v) => `${v} ${v > 20 ? '⚠️' : ''}`
  },
  {
    id: 'meteors',
    type: 'display',
    label: 'Meteors',
    elementId: 'debugMeteors',
    getValue: (state) => state.meteors.length
  },
  {
    id: 'pickups',
    type: 'display',
    label: 'Pickups',
    elementId: 'debugPickups',
    getValue: (state) => state.powerUpPickups.length
  },
  {
    id: 'magnetStacks',
    type: 'display',
    label: 'Magnet Stacks',
    elementId: 'debugMagnetStacks',
    section: 'Magnet',
    getValue: (state) => {
      const magnetPowerUp = state.activePowerUps.find(p => p.id === 'magnet');
      const magnetStacks = magnetPowerUp?.stacks ?? 0;
      const magnetTier = state.modifiers.magnetPullTier || 0;
      const isSuperMagnet = state.modifiers.superMagnet;
      const tierLabels = ['', 'T1', 'T2 ⚡', 'T3 ⚡⚡'];
      return isSuperMagnet
        ? `${magnetStacks} SUPER!`
        : `${magnetStacks} ${tierLabels[magnetTier] || ''}`;
    },
    format: (v) => String(v)
  },
  {
    id: 'magnetRate',
    type: 'display',
    label: 'Magnet Rate',
    elementId: 'debugMagnetRate',
    section: 'Magnet',
    getValue: (state) => Math.round(state.modifiers.spawnRateMagnet * 100),
    format: (v) => `${v}%`
  },
  {
    id: 'magnetTime',
    type: 'display',
    label: 'Magnet Time',
    elementId: 'debugMagnetTime',
    section: 'Magnet',
    getValue: (state) => {
      const magnetPowerUp = state.activePowerUps.find(p => p.id === 'magnet');
      const magnetTimeLeft = magnetPowerUp?.expiresAt
        ? Math.max(0, (magnetPowerUp.expiresAt - performance.now()) / 1000)
        : 0;
      return magnetTimeLeft > 0 ? magnetTimeLeft.toFixed(1) : '-';
    },
    format: (v) => v === '-' ? '-' : `${v}s`
  },
  {
    id: 'spawnRate',
    type: 'display',
    label: 'Spawn Rate',
    elementId: 'debugSpawnRate',
    getValue: () => config.SPAWN_CRYSTAL_RATE,
    format: (v) => v.toFixed(3)
  },
  {
    id: 'playerPos',
    type: 'display',
    label: 'Player Pos',
    elementId: 'debugPlayerPos',
    getValue: (state) => {
      if (state.player) {
        return `${Math.round(state.player.x)}, ${Math.round(state.player.y)}`;
      }
      return '0, 0';
    }
  },

  // Custom controls (difficulty, magnet styling)
  {
    id: 'difficulty',
    type: 'custom',
    label: 'Difficulty',
    elementIds: ['debugDifficulty', 'difficultyFill'],
    render: (state, elements) => {
      const diffElement = elements.get('debugDifficulty');
      const fillElement = elements.get('difficultyFill');
      
      if (diffElement) {
        const diffLevel = getDifficultyLevel(state.score);
        const diffPercent = getDifficultyPercent(state.gameSpeed);
        const isMaxDifficulty = state.gameSpeed >= config.difficulty.MAX_GAME_SPEED - 1e-6;
        const maxDiffLevel = getMaxDifficultyLevel();
        const displayLevel = isMaxDifficulty ? Math.min(diffLevel, maxDiffLevel) : diffLevel;
        
        diffElement.textContent = isMaxDifficulty
          ? `Lv.${displayLevel} (MAX!)`
          : `Lv.${diffLevel} (${diffPercent}%)`;
        diffElement.style.color = isMaxDifficulty
          ? '#ff4444'
          : diffPercent > 70
            ? '#ffaa00'
            : '#00ff88';
      }
      
      if (fillElement) {
        const diffPercent = getDifficultyPercent(state.gameSpeed);
        fillElement.style.width = `${diffPercent}%`;
      }
    }
  },
  {
    id: 'magnetStacksStyle',
    type: 'custom',
    label: '',
    elementIds: ['debugMagnetStacks'],
    render: (state, elements) => {
      const element = elements.get('debugMagnetStacks');
      if (element) {
        const magnetTier = state.modifiers.magnetPullTier || 0;
        const tierColors = ['#666', '#ff6644', '#ff9944', '#ffcc00'];
        element.style.color = tierColors[magnetTier] || '#ff6644';
      }
    }
  },

  // Toggle controls
  {
    id: 'grid',
    type: 'toggle',
    label: 'Grid',
    key: 'g',
    statusElementId: 'statusGrid',
    getValue: (state) => state.debug?.grid ?? false,
    setValue: (state, value) => { if (state.debug) state.debug.grid = value; }
  },
  {
    id: 'boxes',
    type: 'toggle',
    label: 'Boxes',
    key: 'b',
    statusElementId: 'statusBoxes',
    getValue: (state) => state.debug?.boxes ?? false,
    setValue: (state, value) => { if (state.debug) state.debug.boxes = value; }
  },
  {
    id: 'particles',
    type: 'toggle',
    label: 'Particles',
    key: 'shift+p',
    statusElementId: 'statusParticles',
    getValue: (state) => state.debug?.particles ?? false,
    setValue: (state, value) => { if (state.debug) state.debug.particles = value; }
  },
  {
    id: 'invincibility',
    type: 'toggle',
    label: 'Invincible',
    key: 'i',
    statusElementId: 'statusInvincibility',
    getValue: (state) => state.debug?.invincibility ?? false,
    setValue: (state, value) => { if (state.debug) state.debug.invincibility = value; }
  },
  {
    id: 'meteors',
    type: 'toggle',
    label: 'Meteors',
    key: 'm',
    statusElementId: 'statusMeteors',
    getValue: (state) => state.debug?.meteors ?? true,
    setValue: (state, value) => { if (state.debug) state.debug.meteors = value; }
  },
  {
    id: 'forceMaxDifficulty',
    type: 'toggle',
    label: 'Force Max',
    key: 'f',
    statusElementId: 'statusForceMaxDifficulty',
    getValue: (state) => state.debug?.forceMaxDifficulty ?? false,
    setValue: (state, value) => { if (state.debug) state.debug.forceMaxDifficulty = value; }
  },
  {
    id: 'crystalCyan',
    type: 'toggle',
    label: 'Cyan',
    key: '1',
    section: 'Crystal Flags',
    statusElementId: 'statusCrystalCyan',
    getValue: () => config.features.ENABLE_CRYSTAL_CYAN,
    setValue: (_, value) => { config.features.ENABLE_CRYSTAL_CYAN = value; }
  },
  {
    id: 'crystalPurple',
    type: 'toggle',
    label: 'Purple',
    key: '2',
    section: 'Crystal Flags',
    statusElementId: 'statusCrystalPurple',
    getValue: () => config.features.ENABLE_CRYSTAL_PURPLE,
    setValue: (_, value) => { config.features.ENABLE_CRYSTAL_PURPLE = value; }
  },
  {
    id: 'crystalGold',
    type: 'toggle',
    label: 'Gold',
    key: '3',
    section: 'Crystal Flags',
    statusElementId: 'statusCrystalGold',
    getValue: () => config.features.ENABLE_CRYSTAL_GOLD,
    setValue: (_, value) => { config.features.ENABLE_CRYSTAL_GOLD = value; }
  },
  {
    id: 'crystalRainbow',
    type: 'toggle',
    label: 'Rainbow',
    key: '4',
    section: 'Crystal Flags',
    statusElementId: 'statusCrystalRainbow',
    getValue: () => config.features.ENABLE_CRYSTAL_RAINBOW,
    setValue: (_, value) => { config.features.ENABLE_CRYSTAL_RAINBOW = value; }
  },
  {
    id: 'rainbowRain',
    type: 'toggle',
    label: 'Rainbow Rain',
    key: 'r',
    section: 'Gameplay',
    statusElementId: 'statusRainbowRain',
    getValue: (state) => !!state.activeRainbowRain,
    setValue: (state, value) => { 
      if (value) {
        activateRainbowRain(state);
      } else {
        state.activeRainbowRain = undefined;
      }
    }
  },
  {
    id: 'chainLightningParticles',
    type: 'toggle',
    label: 'No Blur Mode',
    key: 'l',
    section: 'Performance',
    statusElementId: 'statusChainLightningParticles',
    getValue: () => config.rainbowRain.CHAIN_LIGHTNING_USE_LARGE_PARTICLES,
    setValue: (_, value) => { config.rainbowRain.CHAIN_LIGHTNING_USE_LARGE_PARTICLES = value; }
  },

  // Numeric controls (crystal weights)
  {
    id: 'weightCyan',
    type: 'numeric',
    label: 'Cyan',
    section: 'Spawn Weights',
    valueElementId: 'weightCyan',
    decButtonId: 'weightCyanDec',
    incButtonId: 'weightCyanInc',
    getValue: () => config.crystal.spawnWeights.cyan,
    setValue: (_, value) => { config.crystal.spawnWeights.cyan = value; },
    min: 0,
    max: 20,
    step: 1
  },
  {
    id: 'weightPurple',
    type: 'numeric',
    label: 'Purple',
    section: 'Spawn Weights',
    valueElementId: 'weightPurple',
    decButtonId: 'weightPurpleDec',
    incButtonId: 'weightPurpleInc',
    getValue: () => config.crystal.spawnWeights.purple,
    setValue: (_, value) => { config.crystal.spawnWeights.purple = value; },
    min: 0,
    max: 20,
    step: 1
  },
  {
    id: 'weightGold',
    type: 'numeric',
    label: 'Gold',
    section: 'Spawn Weights',
    valueElementId: 'weightGold',
    decButtonId: 'weightGoldDec',
    incButtonId: 'weightGoldInc',
    getValue: () => config.crystal.spawnWeights.gold,
    setValue: (_, value) => { config.crystal.spawnWeights.gold = value; },
    min: 0,
    max: 20,
    step: 1
  },
  {
    id: 'weightRainbow',
    type: 'numeric',
    label: 'Rainbow',
    section: 'Spawn Weights',
    valueElementId: 'weightRainbow',
    decButtonId: 'weightRainbowDec',
    incButtonId: 'weightRainbowInc',
    getValue: () => config.crystal.spawnWeights.rainbow,
    setValue: (_, value) => { config.crystal.spawnWeights.rainbow = value; },
    min: 0,
    max: 20,
    step: 1
  }
];
