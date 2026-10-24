import { useEffect } from 'react';
import type { Settings } from './store';

/** Mirrors text size and appearance onto <html> so the CSS tokens can respond. */
export function useApplySettings(settings: Settings) {
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.textSize = settings.textSize;
    if (settings.appearance === 'system') delete root.dataset.theme;
    else root.dataset.theme = settings.appearance;

    const dark =
      settings.appearance === 'dark' ||
      (settings.appearance === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#141210' : '#F7F6F2');
  }, [settings.textSize, settings.appearance]);
}
