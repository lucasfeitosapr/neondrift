import { GameState } from './types';

export const keys: Record<string, boolean> = {};

// Touch state for virtual joystick
let touchActive = false;
let touchStartX = 0;
let touchStartY = 0;
let touchCurrentX = 0;
let touchCurrentY = 0;

// Deadzone and sensitivity for touch controls
const TOUCH_DEADZONE = 15; // pixels before movement registers
const TOUCH_SENSITIVITY = 0.4; // lower = more sensitive

export function initInput(state?: GameState): void {
  // normalize to lowercase keys
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    keys[k] = true;
    // Only restart on Enter key when game is not running (prevents accidental restarts)
    if (state && !state.gameRunning && k === 'enter') {
      (state as any)._restartRequested = true;
    }
  });

  document.addEventListener('keyup', (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    keys[k] = false;
  });

  // ═══════════════════════════════════════════════════════════════
  // TOUCH CONTROLS - Virtual joystick style
  // Touch anywhere and drag to move, like a floating joystick
  // ═══════════════════════════════════════════════════════════════
  
  const canvas = document.getElementById('gameCanvas');
  if (!canvas) return;

  canvas.addEventListener('touchstart', (e: TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    touchActive = true;
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchCurrentX = touch.clientX;
    touchCurrentY = touch.clientY;
    
    // Tap to restart when game over
    if (state && !state.gameRunning) {
      (state as any)._restartRequested = true;
    }
  }, { passive: false });

  canvas.addEventListener('touchmove', (e: TouchEvent) => {
    e.preventDefault();
    if (!touchActive) return;
    const touch = e.touches[0];
    touchCurrentX = touch.clientX;
    touchCurrentY = touch.clientY;
    updateTouchKeys();
  }, { passive: false });

  canvas.addEventListener('touchend', (e: TouchEvent) => {
    e.preventDefault();
    touchActive = false;
    // Clear all touch-driven keys
    keys['arrowleft'] = false;
    keys['arrowright'] = false;
    keys['arrowup'] = false;
    keys['arrowdown'] = false;
  }, { passive: false });

  canvas.addEventListener('touchcancel', () => {
    touchActive = false;
    keys['arrowleft'] = false;
    keys['arrowright'] = false;
    keys['arrowup'] = false;
    keys['arrowdown'] = false;
  });

  function updateTouchKeys() {
    const dx = touchCurrentX - touchStartX;
    const dy = touchCurrentY - touchStartY;

    // Horizontal movement
    if (dx < -TOUCH_DEADZONE) {
      keys['arrowleft'] = true;
      keys['arrowright'] = false;
    } else if (dx > TOUCH_DEADZONE) {
      keys['arrowright'] = true;
      keys['arrowleft'] = false;
    } else {
      keys['arrowleft'] = false;
      keys['arrowright'] = false;
    }

    // Vertical movement
    if (dy < -TOUCH_DEADZONE) {
      keys['arrowup'] = true;
      keys['arrowdown'] = false;
    } else if (dy > TOUCH_DEADZONE) {
      keys['arrowdown'] = true;
      keys['arrowup'] = false;
    } else {
      keys['arrowup'] = false;
      keys['arrowdown'] = false;
    }
  }
}
