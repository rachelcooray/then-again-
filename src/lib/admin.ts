import { useEffect, useState, useSyncExternalStore } from 'react';
import { authPreview, useSession } from './auth';
import { call, rpc, select, write } from './backend';

/**
 * The admin pages' data. With the server connected, only admins (rows in public.admins) get in,
 * and decisions are saved to the database. In preview they run on the calendar bundled with
 * the app, and decisions are kept in this browser.
 */

export type AdminAccess = 'preview' | 'checking' | 'signed-out' | 'denied' | 'admin';

export function useAdminAccess(): AdminAccess {
  const session = useSession();
  const [access, setAccess] = useState<AdminAccess>(authPreview ? 'preview' : 'checking');
  useEffect(() => {
    if (authPreview) return;
    if (!session) return setAccess('signed-out');
    let live = true;
    setAccess('checking');
    void rpc<boolean>('is_admin', {}).then((ok) => live && setAccess(ok ? 'admin' : 'denied'));
    return () => {
      live = false;
    };
  }, [session]);
  return access;
}

// ---------------------------------------------------------------- Review decisions

export interface Decision {
  decision: 'approved' | 'changes';
  note: string;
  at: string;
}

const LOCAL_KEY = 'then-again:reviews';
let decisions: Record<string, Decision> = {};
let loaded = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function readLocal(): Record<string, Decision> {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '{}') as Record<string, Decision>;
  } catch {
    return {};
  }
}

export async function loadDecisions(): Promise<void> {
  if (loaded) return;
  loaded = true;
  if (authPreview) {
    decisions = readLocal();
  } else {
    const rows = await select<{ puzzle_id: string; decision: Decision['decision']; note: string; decided_at: string }>(
      'content_reviews',
      'select=puzzle_id,decision,note,decided_at&order=decided_at.asc',
    );
    // Later decisions replace earlier ones.
    for (const r of rows ?? []) decisions[r.puzzle_id] = { decision: r.decision, note: r.note, at: r.decided_at };
  }
  emit();
}

export async function decide(puzzleId: string, decision: Decision['decision'], note: string): Promise<void> {
  const d: Decision = { decision, note: note.trim(), at: new Date().toISOString() };
  if (!authPreview) await write('POST', 'content_reviews', { puzzle_id: puzzleId, decision, note: d.note });
  decisions = { ...decisions, [puzzleId]: d };
  if (authPreview) {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(decisions));
    } catch {
      // Kept in memory for this visit.
    }
  }
  emit();
}

export function useDecisions(): Record<string, Decision> {
  useEffect(() => void loadDecisions(), []);
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => decisions,
    () => decisions,
  );
}

// ---------------------------------------------------------------- Server records

export interface UsageSummary {
  days: number;
  first_opens: number;
  visits: number;
  puzzles: number;
  full_days: number;
  links_found: number;
  links_tried: number;
  day7_returns: number;
  accounts: number;
  feedback_open: number;
  errors_7d: number;
}

export const usageSummary = () => call<UsageSummary>('admin_usage_summary', { p_days: 30 });

export interface PlayerRecord {
  id: string;
  email: string;
  joined: string;
  last_sign_in: string | null;
  results: number;
  saved_at: string | null;
}

export const findPlayer = (email: string) => call<PlayerRecord | null>('admin_find_player', { p_email: email });
export const deletePlayer = (id: string) => call<null>('admin_delete_player', { p_player: id });

export interface FeedbackRow {
  id: number;
  message: string;
  reply_to: string | null;
  kind: string;
  route: string | null;
  app_version: string;
  platform: string;
  created_at: string;
  handled_at: string | null;
}

export interface ErrorRow {
  id: number;
  message: string;
  route: string | null;
  app_version: string;
  platform: string;
  received_at: string;
}

export const listFeedback = () => select<FeedbackRow>('feedback', 'select=*&order=created_at.desc&limit=100');
export const listErrors = () => select<ErrorRow>('client_errors', 'select=id,message,route,app_version,platform,received_at&order=received_at.desc&limit=100');
export const markHandled = (id: number) => write('PATCH', `feedback?id=eq.${id}`, { handled_at: new Date().toISOString() });

export const saveSwitch = (key: string, value: unknown) =>
  write('POST', 'app_config?on_conflict=key', { key, value, updated_at: new Date().toISOString() }, 'resolution=merge-duplicates,return=minimal');
