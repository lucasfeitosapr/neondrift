import { fetchQuantumSeed } from './quantum';
import { RunSeedPayload } from './types';

const STORAGE_KEY = 'neondrift_daily_seed';

interface StoredDaily {
  date: string;
  payload: RunSeedPayload;
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function getDailyChallengeSeed(): Promise<RunSeedPayload> {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed: StoredDaily = JSON.parse(stored);
      if (parsed.date === todayKey()) {
        return { ...parsed.payload, isDailyRun: true };
      }
    } catch { /* ignore malformed entry */ }
  }
  const payload = await fetchQuantumSeed();
  const daily: RunSeedPayload = { ...payload, isDailyRun: true };
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: todayKey(), payload: daily } satisfies StoredDaily));
  return daily;
}

export function clearDailyChallengeSeed(): void {
  localStorage.removeItem(STORAGE_KEY);
}
