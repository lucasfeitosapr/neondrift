import type { RunSeedPayload } from './types';

const ANU_URL = 'https://qrng.anu.edu.au/API/jsonI.php?length=8&type=hex16';
const FETCH_TIMEOUT_MS = 10000;

// XOR-fold 8 uint16 chunks into one uint32 so all available entropy feeds the seed
function xorFoldToUint32(chunks: string[]): number {
  let lo = 0;
  let hi = 0;
  for (let i = 0; i < chunks.length; i++) {
    const val = parseInt(chunks[i], 16);
    if (i % 2 === 0) lo ^= val;
    else hi ^= val;
  }
  return ((hi << 16) | lo) >>> 0;
}

function localFallback(): RunSeedPayload {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  const seed = buf[0];
  const hex = seed.toString(16).padStart(8, '0');
  return { hex, seed, source: 'local', measuredAt: Date.now() };
}

// Parse a hex string (copied from the death screen) back into a RunSeedPayload.
// Splits into 4-char chunks and applies the same xorFold used at fetch time,
// so the same hex always produces the same uint32 seed.
export function parseSeedHex(raw: string): RunSeedPayload | null {
  const clean = raw.trim().toLowerCase().replace(/[^0-9a-f]/g, '');
  if (clean.length < 4) return null;
  // Pad to nearest multiple of 4, then split into 4-char (16-bit) chunks
  const padded = clean.padEnd(Math.ceil(clean.length / 4) * 4, '0');
  const chunks: string[] = [];
  for (let i = 0; i < padded.length; i += 4) chunks.push(padded.slice(i, i + 4));
  const seed = xorFoldToUint32(chunks);
  return { hex: clean, seed, source: 'manual', measuredAt: Date.now() };
}

export async function fetchQuantumSeed(): Promise<RunSeedPayload> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(ANU_URL, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json() as { success: boolean; data: string[] };
    if (!json.success || !Array.isArray(json.data) || json.data.length < 8) {
      throw new Error('Invalid ANU response shape');
    }
    const hex = json.data.join('');
    const seed = xorFoldToUint32(json.data);
    return { hex, seed, source: 'quantum', measuredAt: Date.now() };
  } catch {
    clearTimeout(timer);
    return localFallback();
  }
}
