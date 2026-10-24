import { Capacitor } from '@capacitor/core';

declare const __APP_VERSION__: string;

/** The app's version, from package.json at build time. */
export const APP_VERSION: string = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.0.0';

/** 'ios', 'android' or 'web'. */
export const PLATFORM: string = Capacitor.getPlatform();

export const isNative = Capacitor.isNativePlatform();

/** Compares dotted versions: negative if a < b. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d) return d;
  }
  return 0;
}
