import { useEffect, useState } from 'react';
import { select } from './backend';

/**
 * Switches read from the server at launch, so a puzzle can be paused, a feature turned on or
 * an old version asked to update without shipping a new build. The last copy is kept on the
 * device, and safe defaults apply until the server has ever answered.
 */
export interface RemoteConfig {
  min_version: string;
  latest_version: string;
  monetisation_enabled: boolean;
  gems_enabled: boolean;
  /** Formats taken out of play for now, for example while a bad puzzle is replaced. */
  paused_formats: string[];
  /** A short message shown on Today, or null. */
  banner: { text: string } | null;
}

export const DEFAULT_REMOTE: RemoteConfig = {
  min_version: '0.0.0',
  latest_version: '0.0.0',
  monetisation_enabled: false,
  gems_enabled: false,
  paused_formats: [],
  banner: null,
};

const KEY = 'then-again:remote-config';
const REFRESH_MS = 60 * 60 * 1000;

function cached(): RemoteConfig {
  try {
    return { ...DEFAULT_REMOTE, ...(JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<RemoteConfig>) };
  } catch {
    return DEFAULT_REMOTE;
  }
}

let current = typeof localStorage !== 'undefined' ? cached() : DEFAULT_REMOTE;
let fetchedAt = 0;
const listeners = new Set<(c: RemoteConfig) => void>();

export async function refreshRemoteConfig(force = false): Promise<RemoteConfig> {
  if (!force && Date.now() - fetchedAt < REFRESH_MS) return current;
  fetchedAt = Date.now();
  const rows = await select<{ key: string; value: unknown }>('app_config', 'select=key,value');
  if (!rows) return current;
  const next = { ...DEFAULT_REMOTE } as Record<string, unknown>;
  for (const { key, value } of rows) if (key in DEFAULT_REMOTE) next[key] = value;
  current = next as unknown as RemoteConfig;
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    // Keep using it in memory.
  }
  listeners.forEach((l) => l(current));
  return current;
}

export function useRemoteConfig(): RemoteConfig {
  const [config, setConfig] = useState(current);
  useEffect(() => {
    listeners.add(setConfig);
    void refreshRemoteConfig();
    const onVisible = () => document.visibilityState === 'visible' && void refreshRemoteConfig();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      listeners.delete(setConfig);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);
  return config;
}
