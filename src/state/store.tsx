import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { DateKey } from '../lib/date';
import { addRecord, type ProgressMap, type PuzzleRecord } from './progress';

export type TextSize = 'standard' | 'large' | 'larger';
export type Appearance = 'system' | 'light' | 'dark';
/** Where the player grew up, asked once on Today; helps choose memories that ring true. */
export type Region = 'uk' | 'us' | 'other' | 'skipped';

export interface Settings {
  textSize: TextSize;
  appearance: Appearance;
  sound: boolean;
  /** Anonymous usage counts for the pilot; players can turn this off. */
  shareUsage: boolean;
  /** Not yet asked while undefined. */
  region?: Region;
}

export interface ReminderPrefs {
  /** The player has answered the permission prompt. */
  asked: boolean;
  daily: boolean;
  streak: boolean;
  rewards: boolean;
  quietHours: boolean;
  quietStart: string;
  quietEnd: string;
  time: string;
}

export interface AppData {
  version: 1;
  settings: Settings;
  progress: ProgressMap;
  /** Display balance only; the authoritative wallet moves server-side in phase 5. */
  gems: number;
  reminders: ReminderPrefs;
  /** Saved puzzle boards by date and format, so an attempt survives leaving the screen. */
  attempts: Record<string, unknown>;
  /** Guesses at each day's hidden link, in order. */
  links: Record<DateKey, string[]>;
  /** Stories the player saved from result cards, newest first. Kept on this phone only. */
  memories: SavedMemory[];
  /** "Did you have one?" answers by puzzle id. */
  votes: Record<string, boolean>;
}

export interface SavedMemory {
  /** The puzzle id the story came from. */
  id: string;
  date: DateKey;
  formatId: string;
  title?: string;
  text: string;
  /** The player's own words, if they added any. */
  note: string;
  savedAt: string;
}

export const STORAGE_KEY = 'then-again:v1';

export const DEFAULT_DATA: AppData = {
  version: 1,
  settings: { textSize: 'standard', appearance: 'system', sound: true, shareUsage: true },
  progress: {},
  gems: 0,
  reminders: {
    asked: false,
    daily: false,
    streak: false,
    rewards: false,
    quietHours: true,
    quietStart: '22:00',
    quietEnd: '08:00',
    time: '09:00',
  },
  attempts: {},
  links: {},
  memories: [],
  votes: {},
};

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DATA;
    const parsed = JSON.parse(raw) as Partial<AppData>;
    if (parsed.version !== 1) return DEFAULT_DATA;
    return {
      ...DEFAULT_DATA,
      ...parsed,
      settings: { ...DEFAULT_DATA.settings, ...parsed.settings },
      reminders: { ...DEFAULT_DATA.reminders, ...parsed.reminders },
      progress: parsed.progress ?? {},
      attempts: parsed.attempts ?? {},
      links: parsed.links ?? {},
      memories: parsed.memories ?? [],
      votes: parsed.votes ?? {},
    };
  } catch {
    return DEFAULT_DATA;
  }
}

function saveData(data: AppData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage can be unavailable (private mode, quota); play carries on in memory.
  }
}

interface Store {
  data: AppData;
  updateSettings: (patch: Partial<Settings>) => void;
  updateReminders: (patch: Partial<ReminderPrefs>) => void;
  recordResult: (record: PuzzleRecord) => void;
  saveAttempt: (key: string, state: unknown) => void;
  guessLink: (date: DateKey, guess: string) => void;
  /** Saves a story, or updates the note on one already saved. */
  saveMemory: (memory: SavedMemory) => void;
  removeMemory: (id: string) => void;
  vote: (puzzleId: string, hadOne: boolean) => void;
  /** Brings in progress from another phone. Results and stories already on this phone are kept. */
  importData: (incoming: Pick<AppData, 'progress' | 'settings' | 'reminders'> & Partial<Pick<AppData, 'memories'>>) => void;
  resetAll: () => void;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children, initial }: { children: ReactNode; initial?: AppData }) {
  const [data, setData] = useState<AppData>(() => initial ?? loadData());

  useEffect(() => saveData(data), [data]);

  const updateSettings = useCallback(
    (patch: Partial<Settings>) => setData((d) => ({ ...d, settings: { ...d.settings, ...patch } })),
    [],
  );
  const updateReminders = useCallback(
    (patch: Partial<ReminderPrefs>) => setData((d) => ({ ...d, reminders: { ...d.reminders, ...patch } })),
    [],
  );
  const recordResult = useCallback(
    (record: PuzzleRecord) => setData((d) => ({ ...d, progress: addRecord(d.progress, record) })),
    [],
  );
  const saveAttempt = useCallback(
    (key: string, state: unknown) => setData((d) => ({ ...d, attempts: { ...d.attempts, [key]: state } })),
    [],
  );
  const guessLink = useCallback(
    (date: DateKey, guess: string) => setData((d) => ({ ...d, links: { ...d.links, [date]: [...(d.links[date] ?? []), guess] } })),
    [],
  );
  const saveMemory = useCallback(
    (m: SavedMemory) => setData((d) => ({ ...d, memories: [m, ...d.memories.filter((x) => x.id !== m.id)] })),
    [],
  );
  const removeMemory = useCallback((id: string) => setData((d) => ({ ...d, memories: d.memories.filter((x) => x.id !== id) })), []);
  const vote = useCallback((puzzleId: string, hadOne: boolean) => setData((d) => ({ ...d, votes: { ...d.votes, [puzzleId]: hadOne } })), []);
  const importData = useCallback(
    (incoming: Pick<AppData, 'progress' | 'settings' | 'reminders'> & Partial<Pick<AppData, 'memories'>>) =>
      setData((d) => ({
        ...d,
        progress: Object.values(incoming.progress ?? {}).reduce(addRecord, d.progress),
        settings: { ...d.settings, ...incoming.settings },
        reminders: { ...d.reminders, ...incoming.reminders },
        memories: [...d.memories, ...(incoming.memories ?? []).filter((m) => !d.memories.some((x) => x.id === m.id))],
      })),
    [],
  );
  const resetAll = useCallback(() => setData(DEFAULT_DATA), []);

  const value = useMemo(
    () => ({ data, updateSettings, updateReminders, recordResult, saveAttempt, guessLink, saveMemory, removeMemory, vote, importData, resetAll }),
    [data, updateSettings, updateReminders, recordResult, saveAttempt, guessLink, saveMemory, removeMemory, vote, importData, resetAll],
  );
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside StoreProvider');
  return store;
}
