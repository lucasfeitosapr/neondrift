import { GameState } from './types';

const COUNTDOWN_DURATION_MS = 3000;

export interface PauseSystem {
  syncPauseButton: () => void;
  setPauseState: (paused: boolean, options?: { showCountdown?: boolean }) => void;
  togglePause: (force?: boolean) => void;
  updateResumeCountdown: (now: number) => boolean; // Returns true if countdown is active
}

export function createPauseSystem(
  state: GameState,
  pauseButton: HTMLButtonElement | null,
  eventManager: { addEventListener: (element: EventTarget, event: string, handler: EventListener) => void }
): PauseSystem {
  function syncPauseButton(): void {
    if (!pauseButton) return;
    pauseButton.classList.toggle('paused', state.paused);
    pauseButton.textContent = state.paused ? 'R E S U M E' : 'P A U S E';
    pauseButton.disabled = !state.gameRunning;
    pauseButton.setAttribute('aria-pressed', state.paused ? 'true' : 'false');
    pauseButton.title = state.paused ? 'Resume (P / Esc)' : 'Pause (P / Esc)';
  }

  function setPauseState(paused: boolean, options?: { showCountdown?: boolean }): void {
    const effectivePause = paused && state.gameRunning;
    const wasPaused = state.paused;
    state.paused = effectivePause;
    
    if (!effectivePause && wasPaused && options?.showCountdown) {
      state.resumeCountdownActive = true;
      state.resumeCountdownTarget = performance.now() + COUNTDOWN_DURATION_MS;
      state.resumeCountdownValue = 3;
    } else if (effectivePause) {
      state.resumeCountdownActive = false;
      state.resumeCountdownTarget = null;
      state.resumeCountdownValue = undefined;
    }
    syncPauseButton();
  }

  function togglePause(force?: boolean): void {
    if (!state.gameRunning) {
      setPauseState(false);
      return;
    }
    const next = force ?? !state.paused;
    setPauseState(next, { showCountdown: !next });
  }

  function updateResumeCountdown(now: number): boolean {
    if (!state.resumeCountdownActive) return false;
    
    const target = state.resumeCountdownTarget ?? now;
    const remainingMs = Math.max(0, target - now);
    
    if (remainingMs <= 0) {
      state.resumeCountdownActive = false;
      state.resumeCountdownTarget = null;
      state.resumeCountdownValue = undefined;
      return false;
    }
    
    const nextValue = Math.max(1, Math.ceil(remainingMs / 1000));
    if (nextValue !== state.resumeCountdownValue) {
      state.resumeCountdownValue = nextValue;
    }
    return true;
  }

  // Wire up pause button
  if (pauseButton) {
    eventManager.addEventListener(pauseButton, 'click', () => {
      togglePause();
    });
  }

  // Initial sync
  syncPauseButton();

  return {
    syncPauseButton,
    setPauseState,
    togglePause,
    updateResumeCountdown
  };
}
