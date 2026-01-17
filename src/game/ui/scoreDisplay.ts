import { GameState } from '../types';
import { getScoreDisplayText, getHighScoreDisplayText, isNewHighScore } from '../scoring';

export function updateScoreDisplay(
  state: Pick<GameState, 'score' | 'highScore'>,
  scoreElement: HTMLElement,
  highScoreElement: HTMLElement
): void {
  scoreElement.textContent = getScoreDisplayText(state.score);
  
  if (isNewHighScore(state.score, state.highScore)) {
    state.highScore = state.score;
    try {
      localStorage.setItem('neondrift_highscore', String(state.highScore));
    } catch {
      // localStorage unavailable
    }
    highScoreElement.textContent = getHighScoreDisplayText(state.highScore);
  }
}

export function initializeHighScoreDisplay(
  highScore: number,
  highScoreElement: HTMLElement
): void {
  highScoreElement.textContent = getHighScoreDisplayText(highScore);
}
