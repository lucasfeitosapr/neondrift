import { startGame } from './game/game';
import { clearDailyChallengeSeed } from './game/dailyChallenge';
import { parseSeedHex } from './game/quantum';

const menuOverlay = document.getElementById('menuOverlay') as HTMLDivElement;
const startBtn = document.getElementById('startBtn') as HTMLButtonElement;
const dailyBtn = document.getElementById('dailyBtn') as HTMLButtonElement;
const quitBtn = document.getElementById('quitBtn') as HTMLButtonElement;
const seedInput = document.getElementById('seedInput') as HTMLInputElement;
const playSeedBtn = document.getElementById('playSeedBtn') as HTMLButtonElement;
const seedHint = document.getElementById('seedHint') as HTMLDivElement;
const refetchDailyBtn = document.getElementById('refetchDailyBtn') as HTMLButtonElement | null;

startBtn.addEventListener('click', () => {
  menuOverlay.classList.add('hidden');
  startGame('normal');
});

dailyBtn.addEventListener('click', () => {
  menuOverlay.classList.add('hidden');
  startGame('daily');
});

quitBtn.addEventListener('click', () => {
  const confirmed = confirm('Are you sure you want to quit?');
  if (confirmed) window.close();
});

function launchSeedRun() {
  const payload = parseSeedHex(seedInput.value);
  if (!payload) {
    seedHint.textContent = 'invalid seed — paste the hex from a death screen';
    setTimeout(() => { seedHint.textContent = ''; }, 2500);
    return;
  }
  menuOverlay.classList.add('hidden');
  startGame('normal', payload);
}

playSeedBtn.addEventListener('click', launchSeedRun);

seedInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') launchSeedRun();
});

refetchDailyBtn?.addEventListener('click', () => {
  clearDailyChallengeSeed();
  if (refetchDailyBtn) {
    refetchDailyBtn.textContent = 'Cleared ✓';
    setTimeout(() => { refetchDailyBtn.textContent = 'Re-fetch Daily Seed'; }, 2000);
  }
});
