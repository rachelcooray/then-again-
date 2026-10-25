/**
 * Each scheduled day is stored scrambled, so the bundled schedule doesn't show future
 * answers to anyone who opens the file. This is a light screen against spoilers, not
 * security: the app has to be able to read it offline.
 */

function stream(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) & 255;
  };
}

const KEY = 'then-again:';

export function sealDay(date: string, day: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(day));
  const next = stream(KEY + date);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b ^ next());
  return btoa(bin);
}

export function openDay<T>(date: string, sealed: string): T {
  const bin = atob(sealed);
  const next = stream(KEY + date);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i) ^ next();
  return JSON.parse(new TextDecoder().decode(bytes)) as T;
}
