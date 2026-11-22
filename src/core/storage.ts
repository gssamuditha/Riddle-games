import type { ArchiveStorage, RiddleId, RiddleProgress, ThemeMode } from './types';

const STORAGE_KEY = 'archive_of_impossible_trials_v1';

const DEFAULT_PROGRESS: RiddleProgress = {
  solved: false,
  bestTimeMinutes: null,
  bestMoves: null,
  stars: 0,
  attempts: 0,
  lastPlayedAt: null,
};

function canUseStorage(): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  } catch {
    return false;
  }
}

export function loadArchiveStorage(): ArchiveStorage {
  if (!canUseStorage()) {
    return { riddles: {}, muted: false, theme: 'dark' };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { riddles: {}, muted: false, theme: 'dark' };
    const parsed = JSON.parse(raw) as Partial<ArchiveStorage>;
    return {
      riddles: parsed.riddles ?? {},
      muted: Boolean(parsed.muted),
      theme: parsed.theme === 'light' ? 'light' : 'dark',
    };
  } catch {
    return { riddles: {}, muted: false, theme: 'dark' };
  }
}

function writeArchiveStorage(data: ArchiveStorage): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore quota / privacy mode errors gracefully
  }
}

export function getRiddleProgress(id: RiddleId): RiddleProgress {
  const store = loadArchiveStorage();
  return { ...DEFAULT_PROGRESS, ...(store.riddles[id] ?? {}) };
}

export function recordRiddleAttempt(id: RiddleId): ArchiveStorage {
  const store = loadArchiveStorage();
  const prev = { ...DEFAULT_PROGRESS, ...(store.riddles[id] ?? {}) };
  store.riddles[id] = {
    ...prev,
    attempts: prev.attempts + 1,
    lastPlayedAt: new Date().toISOString(),
  };
  writeArchiveStorage(store);
  return store;
}

export function recordRiddleVictory(
  id: RiddleId,
  result: { timeMinutes: number; moves: number; stars: 1 | 2 | 3 }
): ArchiveStorage {
  const store = loadArchiveStorage();
  const prev = { ...DEFAULT_PROGRESS, ...(store.riddles[id] ?? {}) };
  store.riddles[id] = {
    solved: true,
    bestTimeMinutes:
      prev.bestTimeMinutes === null
        ? result.timeMinutes
        : Math.min(prev.bestTimeMinutes, result.timeMinutes),
    bestMoves:
      prev.bestMoves === null ? result.moves : Math.min(prev.bestMoves, result.moves),
    stars: Math.max(prev.stars, result.stars) as 0 | 1 | 2 | 3,
    attempts: Math.max(1, prev.attempts),
    lastPlayedAt: new Date().toISOString(),
  };
  writeArchiveStorage(store);
  return store;
}

export function setMutedStorage(muted: boolean): void {
  const store = loadArchiveStorage();
  store.muted = muted;
  writeArchiveStorage(store);
}

export function setThemeStorage(theme: ThemeMode): void {
  const store = loadArchiveStorage();
  store.theme = theme;
  writeArchiveStorage(store);
}
