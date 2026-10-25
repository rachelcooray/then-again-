import { useEffect, useSyncExternalStore } from 'react';
import type { ProgressMap } from '../state/progress';
import type { AppData, ReminderPrefs, Settings } from '../state/store';
import { currentSession, useSession, type Session } from './auth';
import { select, write } from './backend';

/**
 * Keeps a signed-in player's progress in their account: results from every phone are
 * combined, never overwritten, and this phone's settings win. Saved memories stay on the phone.
 */

export interface CloudSave {
  progress: ProgressMap;
  settings: Settings;
  reminders: ReminderPrefs;
}

/** Both sides' results; where both have the same puzzle, the earlier first attempt is kept. */
export function mergeSaves(local: CloudSave, remote: Partial<CloudSave> | null): CloudSave {
  const progress: ProgressMap = { ...(remote?.progress ?? {}) };
  for (const [key, r] of Object.entries(local.progress)) {
    const other = progress[key];
    if (!other || (r.completedAt && r.completedAt < other.completedAt)) progress[key] = r;
  }
  return { progress, settings: local.settings, reminders: local.reminders };
}

export interface SyncStatus {
  state: 'idle' | 'syncing' | 'done' | 'error';
  at: string | null;
  message: string;
}

const AT_KEY = 'then-again:synced-at';
const readAt = () => {
  try {
    return localStorage.getItem(AT_KEY);
  } catch {
    return null;
  }
};
let status: SyncStatus = { state: 'idle', at: typeof localStorage !== 'undefined' ? readAt() : null, message: '' };
const listeners = new Set<() => void>();
function setStatus(next: Partial<SyncStatus>) {
  status = { ...status, ...next };
  if (next.at) {
    try {
      localStorage.setItem(AT_KEY, next.at);
    } catch {
      // Only the "last saved" time is lost.
    }
  }
  listeners.forEach((l) => l());
}

export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => status,
    () => status,
  );
}

/**
 * Reads the account's save, combines it with this phone's and writes the result back.
 * Returns what the phone should take in, or null if nothing could be done.
 */
export async function syncNow(session: Session, data: AppData, apply: (save: CloudSave) => void): Promise<void> {
  const local: CloudSave = { progress: data.progress, settings: data.settings, reminders: data.reminders };
  if (session.preview) {
    setStatus({ state: 'done', at: new Date().toISOString(), message: 'Preview: nothing was sent.' });
    return;
  }
  setStatus({ state: 'syncing', message: '' });
  try {
    const rows = await select<{ data: Partial<CloudSave> }>('player_saves', `select=data&player=eq.${session.user.id}`);
    if (!rows) throw new Error('We couldn’t reach your account. Your progress is safe on this phone.');
    const merged = mergeSaves(local, rows[0]?.data ?? null);
    await write('POST', 'player_saves?on_conflict=player', { player: session.user.id, data: merged, updated_at: new Date().toISOString() }, 'resolution=merge-duplicates,return=minimal');
    apply(merged);
    setStatus({ state: 'done', at: new Date().toISOString(), message: '' });
  } catch (e) {
    setStatus({ state: 'error', message: (e as Error).message });
  }
}

/** Saves to the account a few seconds after each new result, and once on sign-in. */
export function useCloudSync(data: AppData, apply: (save: CloudSave) => void) {
  const session = useSession();
  const results = Object.keys(data.progress).length;
  useEffect(() => {
    const s = currentSession();
    if (!s || s.preview) return;
    const t = window.setTimeout(() => void syncNow(s, data, apply), 3000);
    return () => window.clearTimeout(t);
    // Only a new result or a new sign-in should trigger a save, not every change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id, results]);
}
