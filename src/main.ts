import { startGame } from './game/game';

const menuOverlay = document.getElementById('menuOverlay') as HTMLDivElement;
const startBtn = document.getElementById('startBtn') as HTMLButtonElement;
const quitBtn = document.getElementById('quitBtn') as HTMLButtonElement;

startBtn.addEventListener('click', () => {
  menuOverlay.classList.add('hidden');
  startGame();
});

quitBtn.addEventListener('click', () => {
  const confirmed = confirm('Are you sure you want to quit?');
  if (confirmed) {
    window.close();
  }
});
