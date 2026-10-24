import { enqueue } from './backend';
import { APP_VERSION, PLATFORM } from './platform';

const seen = new Set<string>();
const MAX_PER_SESSION = 20;

/** Sends an error report: message, stack, screen and version only, never what the player typed. */
export function reportError(error: unknown, route = typeof location !== 'undefined' ? location.hash : '') {
  const err = error instanceof Error ? error : new Error(String(error));
  const key = `${err.message}|${route}`;
  if (seen.has(key) || seen.size >= MAX_PER_SESSION) return;
  seen.add(key);
  enqueue('client_errors', {
    message: err.message.slice(0, 1000) || 'Unknown error',
    stack: err.stack?.slice(0, 8000) ?? null,
    route: route.slice(0, 200),
    app_version: APP_VERSION,
    platform: PLATFORM,
    occurred_at: new Date().toISOString(),
  });
}

/** Catches errors the app didn't handle itself. */
export function startErrorReporting() {
  if (typeof window === 'undefined') return;
  window.addEventListener('error', (e) => reportError(e.error ?? e.message));
  window.addEventListener('unhandledrejection', (e) => reportError(e.reason));
}
