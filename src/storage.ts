const PREFIX = 'z-asteroids:';

/** No-op storage fallback used when localStorage is unavailable. */
const noopStorage: Pick<Storage, 'getItem' | 'setItem'> = {
  getItem: () => null,
  setItem: () => { /* no-op */ },
};

function getDefaultStore(): Pick<Storage, 'getItem' | 'setItem'> {
  try {
    // In Node/Vitest, localStorage may not exist
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch {
    // ignore
  }
  return noopStorage;
}

export function createStorage(
  store: Pick<Storage, 'getItem' | 'setItem'> = getDefaultStore(),
) {
  function get(key: string): string | null {
    try {
      return store.getItem(PREFIX + key);
    } catch {
      return null;
    }
  }

  function set(key: string, value: string): void {
    try {
      store.setItem(PREFIX + key, value);
    } catch {
      /* ignore — private mode or quota */
    }
  }

  function getHighScore(): number {
    const v = get('highScore');
    return v !== null ? parseInt(v, 10) : 0;
  }

  function saveHighScore(score: number): void {
    set('highScore', String(score));
  }

  function getMuted(): boolean {
    return get('muted') === 'true';
  }

  function saveMuted(muted: boolean): void {
    set('muted', muted ? 'true' : 'false');
  }

  return { getHighScore, saveHighScore, getMuted, saveMuted };
}

export type GameStorage = ReturnType<typeof createStorage>;
