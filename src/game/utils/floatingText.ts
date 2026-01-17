import { GameState, FloatingText } from '../types';
import { config } from '../config';

export function createFloatingText(
  state: Pick<GameState, 'floatingTexts'>,
  x: number,
  y: number,
  text: string,
  color = '#00ffff'
): void {
  const floatingText: FloatingText = {
    x,
    y,
    text,
    life: 1,
    color,
    vy: -0.3 - Math.random() * 0.4
  };
  state.floatingTexts.push(floatingText);
}
