/**
 * A small client for the Supabase REST API. Reports (errors, usage, feedback) go into an
 * outbox on the device first and are sent when the network allows, so nothing is lost
 * offline and the app never waits on the server.
 */

export const URL_BASE = import.meta.env.VITE_SUPABASE_URL as string | undefined;
export const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const backendEnabled = !!(URL_BASE && ANON_KEY);

/** Set by the sign-in module: the signed-in player's token, so reads and writes act as them. */
let tokenFor: (() => Promise<string | null>) | null = null;
export function setTokenProvider(fn: (() => Promise<string | null>) | null) {
  tokenFor = fn;
}
const authHeaders = async () => {
  const token = (await tokenFor?.()) ?? ANON_KEY;
  return { apikey: ANON_KEY!, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
};

const OUTBOX_KEY = 'then-again:outbox';
const OUTBOX_LIMIT = 200;

interface Pending {
  table: string;
  row: Record<string, unknown>;
}

function readOutbox(): Pending[] {
  try {
    return JSON.parse(localStorage.getItem(OUTBOX_KEY) ?? '[]') as Pending[];
  } catch {
    return [];
  }
}

function writeOutbox(items: Pending[]) {
  try {
    localStorage.setItem(OUTBOX_KEY, JSON.stringify(items.slice(-OUTBOX_LIMIT)));
  } catch {
    // Storage full or blocked: drop reports rather than break the game.
  }
}

const headers = () => ({
  apikey: ANON_KEY!,
  Authorization: `Bearer ${ANON_KEY}`,
  'Content-Type': 'application/json',
});

/** Queues a row for a table the app may insert into, and tries to send right away. */
export function enqueue(table: string, row: Record<string, unknown>) {
  writeOutbox([...readOutbox(), { table, row }]);
  void flush();
}

export function pendingCount(): number {
  return readOutbox().length;
}

let flushing = false;

/** Sends queued rows, oldest first. Stops at the first network failure and tries again later. */
export async function flush(): Promise<void> {
  if (!backendEnabled || flushing || (typeof navigator !== 'undefined' && navigator.onLine === false)) return;
  flushing = true;
  try {
    let items = readOutbox();
    while (items.length) {
      const [first] = items;
      const res = await fetch(`${URL_BASE}/rest/v1/${first.table}`, {
        method: 'POST',
        headers: { ...headers(), Prefer: 'return=minimal' },
        body: JSON.stringify(first.row),
      });
      // Server errors are retried later; a rejected row (4xx) would never succeed, so it's dropped.
      if (res.status >= 500) break;
      items = readOutbox().slice(1);
      writeOutbox(items);
    }
  } catch {
    // Offline or the server is unreachable; the outbox keeps everything for next time.
  } finally {
    flushing = false;
  }
}

/** Reads rows from a table the app may read. Returns null when offline or not configured. */
export async function select<T>(table: string, query: string): Promise<T[] | null> {
  if (!backendEnabled) return null;
  try {
    const res = await fetch(`${URL_BASE}/rest/v1/${table}?${query}`, { headers: await authHeaders() });
    return res.ok ? ((await res.json()) as T[]) : null;
  } catch {
    return null;
  }
}

/** Calls a database function. Returns null when offline or not configured. */
export async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T | null> {
  if (!backendEnabled) return null;
  try {
    const res = await fetch(`${URL_BASE}/rest/v1/rpc/${fn}`, { method: 'POST', headers: await authHeaders(), body: JSON.stringify(args) });
    return res.ok ? ((await res.json().catch(() => null)) as T) : null;
  } catch {
    return null;
  }
}

/**
 * A write as the signed-in player or admin. Unlike the outbox, it reports failure, because
 * the screen that asked needs to say so. Throws with a message fit to show.
 */
export async function write(method: 'POST' | 'PATCH' | 'DELETE', path: string, body?: unknown, prefer = 'return=minimal'): Promise<void> {
  if (!backendEnabled) throw new Error('The server isn’t connected yet.');
  let res: Response;
  try {
    res = await fetch(`${URL_BASE}/rest/v1/${path}`, { method, headers: { ...(await authHeaders()), Prefer: prefer }, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw new Error('You seem to be offline. Try again when you’re connected.');
  }
  if (!res.ok) throw new Error(res.status === 401 || res.status === 403 ? 'You don’t have permission to do that.' : 'Something went wrong on our side. Try again in a minute.');
}

/** Like rpc, but throws a message fit to show instead of returning null. */
export async function call<T>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  if (!backendEnabled) throw new Error('The server isn’t connected yet.');
  let res: Response;
  try {
    res = await fetch(`${URL_BASE}/rest/v1/rpc/${fn}`, { method: 'POST', headers: await authHeaders(), body: JSON.stringify(args) });
  } catch {
    throw new Error('You seem to be offline. Try again when you’re connected.');
  }
  if (!res.ok) throw new Error(res.status === 401 || res.status === 403 ? 'You don’t have permission to do that.' : 'Something went wrong on our side. Try again in a minute.');
  return (await res.json().catch(() => null)) as T;
}

/** Sends the outbox whenever the device comes back online or the app returns to the foreground. */
export function startOutbox() {
  if (typeof window === 'undefined') return;
  window.addEventListener('online', () => void flush());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void flush();
  });
  void flush();
}
