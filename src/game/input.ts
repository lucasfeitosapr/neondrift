export const keys: Record<string, boolean> = {};

export function initInput(): void {
  // normalize to lowercase keys
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    keys[k] = true;
  });

  document.addEventListener('keyup', (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    keys[k] = false;
  });
}
