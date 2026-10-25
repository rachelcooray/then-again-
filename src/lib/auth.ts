import { useSyncExternalStore } from 'react';
import { ANON_KEY, backendEnabled, setTokenProvider, URL_BASE } from './backend';

/**
 * Optional accounts, through Supabase Auth: a six-digit code sent by email, or Google.
 * Playing never needs an account; signing in only keeps progress safe across phones.
 *
 * Until a Supabase project is connected, everything here runs as a preview: no email is
 * sent, any six digits sign in, and nothing leaves the phone. Screens say so.
 */

export interface Session {
  accessToken: string;
  refreshToken: string;
  /** Milliseconds since 1970. */
  expiresAt: number;
  user: { id: string; email: string };
  /** A preview sign-in, made while the server isn't connected. */
  preview?: boolean;
}

export const authPreview = !backendEnabled;

const KEY = 'then-again:session';
const listeners = new Set<() => void>();

function read(): Session | null {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? 'null') as Session | null;
  } catch {
    return null;
  }
}

let session: Session | null = typeof localStorage !== 'undefined' ? read() : null;

function setSession(next: Session | null) {
  session = next;
  try {
    if (next) localStorage.setItem(KEY, JSON.stringify(next));
    else localStorage.removeItem(KEY);
  } catch {
    // Without storage the sign-in lasts until the app closes.
  }
  listeners.forEach((l) => l());
}

export function currentSession(): Session | null {
  return session;
}

export function useSession(): Session | null {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => session,
    () => null,
  );
}

export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());

async function auth<T>(path: string, body?: unknown, token?: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${URL_BASE}/auth/v1/${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { apikey: ANON_KEY!, 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error('You seem to be offline. Try again when you’re connected.');
  }
  const data = (await res.json().catch(() => ({}))) as T & { msg?: string; error_description?: string };
  if (res.status === 429) throw new Error('Too many tries. Wait a minute, then try again.');
  if (!res.ok) throw new Error(data.error_description ?? data.msg ?? 'Something went wrong. Try again.');
  return data;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: { id: string; email?: string };
}

const toSession = (t: TokenResponse): Session => ({
  accessToken: t.access_token,
  refreshToken: t.refresh_token,
  expiresAt: Date.now() + t.expires_in * 1000,
  user: { id: t.user.id, email: t.user.email ?? '' },
});

/** Emails a six-digit code. New emails get an account; nobody needs a password. */
export async function requestCode(email: string): Promise<void> {
  if (!isValidEmail(email)) throw new Error('That email address doesn’t look right.');
  if (authPreview) return;
  await auth('otp', { email: email.trim(), create_user: true });
}

export async function verifyCode(email: string, code: string): Promise<Session> {
  const digits = code.replace(/\D/g, '');
  if (digits.length !== 6) throw new Error('The code is six digits.');
  if (authPreview) {
    const s: Session = { accessToken: '', refreshToken: '', expiresAt: Infinity, user: { id: 'preview', email: email.trim() }, preview: true };
    setSession(s);
    return s;
  }
  try {
    const s = toSession(await auth<TokenResponse>('verify', { type: 'email', email: email.trim(), token: digits }));
    setSession(s);
    return s;
  } catch {
    throw new Error('That code didn’t work. Check it, or send a new one.');
  }
}

/** Where "Continue with Google" goes; Supabase sends the player back here signed in. */
export function googleSignInUrl(): string | null {
  if (authPreview) return null;
  const back = `${location.origin}${location.pathname}`;
  return `${URL_BASE}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(back)}`;
}

/**
 * Coming back from Google, the tokens arrive in the address after "#". The app's own pages
 * also live after "#", so this reads the tokens, then sends the player to their account page.
 */
export async function finishRedirectSignIn(): Promise<void> {
  if (authPreview || !location.hash.startsWith('#access_token=')) return;
  const params = new URLSearchParams(location.hash.slice(1));
  const access = params.get('access_token')!;
  history.replaceState(null, '', `${location.pathname}#/account`);
  try {
    const user = await auth<{ id: string; email?: string }>('user', undefined, access);
    setSession(toSession({ access_token: access, refresh_token: params.get('refresh_token') ?? '', expires_in: Number(params.get('expires_in') ?? 3600), user }));
  } catch {
    // The account page shows the signed-out state; the player can try again.
  }
}

/** A token that is good for at least another minute, refreshed if needed; null when signed out. */
export async function freshToken(): Promise<string | null> {
  const s = session;
  if (!s || s.preview) return null;
  if (s.expiresAt - Date.now() > 60_000) return s.accessToken;
  try {
    const next = toSession(await auth<TokenResponse>('token?grant_type=refresh_token', { refresh_token: s.refreshToken }));
    setSession(next);
    return next.accessToken;
  } catch {
    return s.accessToken;
  }
}

export async function signOut(): Promise<void> {
  const s = session;
  setSession(null);
  if (s && !s.preview) await auth('logout', {}, s.accessToken).catch(() => undefined);
}

/** Called once a deleted account is gone from the server. */
export function forgetSession() {
  setSession(null);
}

setTokenProvider(freshToken);
