import { GameState } from './types';
import { EventManager } from './eventManager';

export const keys: Record<string, boolean> = {};

// Touch state for virtual joystick
let touchActive = false;
let touchStartX = 0;
let touchStartY = 0;
let touchCurrentX = 0;
let touchCurrentY = 0;

export const touchState = {
  active: false,
  strength: 0,
  axisX: 0,
  axisY: 0,
  clientX: 0,
  clientY: 0,
  startClientX: 0,
  startClientY: 0
};

// Deadzone for touch controls
const TOUCH_DEADZONE = 6; // pixels before movement registers
const TOUCH_MAX_DISTANCE = 90; // distance for full speed

export function initInput(state?: GameState, eventManager?: EventManager): void {
  const em = eventManager || new EventManager();
  
  // normalize to lowercase keys
  const keydownHandler = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    keys[k] = true;
    if (state && !state.gameRunning && k === 'enter') {
      state._restartRequested = true;
    }
  };
  em.addEventListener(document, 'keydown', keydownHandler);

  const keyupHandler = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    keys[k] = false;
  };
  em.addEventListener(document, 'keyup', keyupHandler);

  // ═══════════════════════════════════════════════════════════════
  // TOUCH CONTROLS - Virtual joystick style
  // Touch anywhere and drag to move, like a floating joystick
  // ═══════════════════════════════════════════════════════════════
  
  const canvas = document.getElementById('gameCanvas');
  if (!canvas) return;

  // ═══════════════════════════════════════════════════════════════
  // MOUSE CONTROLS - Mirror touch joystick behavior
  // Click + drag on canvas to move
  // ═══════════════════════════════════════════════════════════════
  const canvasMouseDownHandler = (e: MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    touchActive = true;
    touchStartX = e.clientX;
    touchStartY = e.clientY;
    touchCurrentX = e.clientX;
    touchCurrentY = e.clientY;
    touchState.clientX = e.clientX;
    touchState.clientY = e.clientY;
    touchState.startClientX = e.clientX;
    touchState.startClientY = e.clientY;
    updateTouchKeys();

    // Click to restart when game over
    if (state && !state.gameRunning) {
      state._restartRequested = true;
    }
  };
  em.addEventListener(canvas, 'mousedown', canvasMouseDownHandler);

  const documentMouseDownHandler = () => {
    if (state && !state.gameRunning) {
      state._restartRequested = true;
    }
  };
  em.addEventListener(document, 'mousedown', documentMouseDownHandler);

  const mousemoveHandler = (e: MouseEvent) => {
    if (!touchActive) return;
    touchCurrentX = e.clientX;
    touchCurrentY = e.clientY;
    touchState.clientX = e.clientX;
    touchState.clientY = e.clientY;
    updateTouchKeys();
  };
  em.addEventListener(document, 'mousemove', mousemoveHandler);

  const mouseupHandler = (e: MouseEvent) => {
    if (e.button !== 0) return;
    if (!touchActive) return;
    touchActive = false;
    touchState.active = false;
    touchState.strength = 0;
    touchState.axisX = 0;
    touchState.axisY = 0;
    touchState.clientX = 0;
    touchState.clientY = 0;
    // Clear all touch-driven keys
    keys['arrowleft'] = false;
    keys['arrowright'] = false;
    keys['arrowup'] = false;
    keys['arrowdown'] = false;
  };
  em.addEventListener(document, 'mouseup', mouseupHandler);

  const touchstartHandler = (e: TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    touchActive = true;
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchCurrentX = touch.clientX;
    touchCurrentY = touch.clientY;
    touchState.clientX = touch.clientX;
    touchState.clientY = touch.clientY;
    touchState.startClientX = touch.clientX;
    touchState.startClientY = touch.clientY;
    updateTouchKeys();
    
    // Tap to restart when game over
    if (state && !state.gameRunning) {
      state._restartRequested = true;
    }
  };
  em.addEventListener(canvas, 'touchstart', touchstartHandler, { passive: false });

  const documentTouchstartHandler = () => {
    if (state && !state.gameRunning) {
      state._restartRequested = true;
    }
  };
  em.addEventListener(document, 'touchstart', documentTouchstartHandler, { passive: true });

  const touchmoveHandler = (e: TouchEvent) => {
    e.preventDefault();
    if (!touchActive) return;
    const touch = e.touches[0];
    touchCurrentX = touch.clientX;
    touchCurrentY = touch.clientY;
    touchState.clientX = touch.clientX;
    touchState.clientY = touch.clientY;
    updateTouchKeys();
  };
  em.addEventListener(canvas, 'touchmove', touchmoveHandler, { passive: false });

  const touchendHandler = (e: TouchEvent) => {
    e.preventDefault();
    touchActive = false;
    touchState.active = false;
    touchState.strength = 0;
    touchState.axisX = 0;
    touchState.axisY = 0;
    touchState.clientX = 0;
    touchState.clientY = 0;
    // Clear all touch-driven keys
    keys['arrowleft'] = false;
    keys['arrowright'] = false;
    keys['arrowup'] = false;
    keys['arrowdown'] = false;
  };
  em.addEventListener(canvas, 'touchend', touchendHandler, { passive: false });

  const touchcancelHandler = () => {
    touchActive = false;
    touchState.active = false;
    touchState.strength = 0;
    touchState.axisX = 0;
    touchState.axisY = 0;
    touchState.clientX = 0;
    touchState.clientY = 0;
    keys['arrowleft'] = false;
    keys['arrowright'] = false;
    keys['arrowup'] = false;
    keys['arrowdown'] = false;
  };
  em.addEventListener(canvas, 'touchcancel', touchcancelHandler);

  function updateTouchKeys() {
    const dx = touchCurrentX - touchStartX;
    const dy = touchCurrentY - touchStartY;
    const distance = Math.hypot(dx, dy);
    const active = distance > TOUCH_DEADZONE;

    const normalized = active
      ? Math.min(1, (distance - TOUCH_DEADZONE) / (TOUCH_MAX_DISTANCE - TOUCH_DEADZONE))
      : 0;
    const axisX = active ? Math.max(-1, Math.min(1, dx / TOUCH_MAX_DISTANCE)) : 0;
    const axisY = active ? Math.max(-1, Math.min(1, dy / TOUCH_MAX_DISTANCE)) : 0;

    touchState.active = touchActive;
    touchState.strength = normalized;
    touchState.axisX = axisX;
    touchState.axisY = axisY;

    // Horizontal movement
    if (axisX < -0.2) {
      keys['arrowleft'] = true;
      keys['arrowright'] = false;
    } else if (axisX > 0.2) {
      keys['arrowright'] = true;
      keys['arrowleft'] = false;
    } else {
      keys['arrowleft'] = false;
      keys['arrowright'] = false;
    }

    // Vertical movement
    if (axisY < -0.2) {
      keys['arrowup'] = true;
      keys['arrowdown'] = false;
    } else if (axisY > 0.2) {
      keys['arrowdown'] = true;
      keys['arrowup'] = false;
    } else {
      keys['arrowup'] = false;
      keys['arrowdown'] = false;
    }
  }
}
