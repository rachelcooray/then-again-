/** App-wide switches and calendar anchors. */
// The content scripts import this file under Node, where import.meta.env doesn't exist.
const env: Record<string, string | undefined> = import.meta.env ?? {};

export const config = {
  /** Local date of daily issue Nº 001. */
  issueEpoch: '2026-10-01',
  /** Monday on which the first theme in the seed rotation starts. */
  themeScheduleStart: '2026-09-07',
  /**
   * Gems, retries and the Collection Cabinet need the server-side wallet (phase 5), so they
   * stay hidden until it exists. Turn on with VITE_GEMS=true.
   */
  gemsEnabled: env.VITE_GEMS === 'true',
  /**
   * Games beyond the free ones need Then Again Plus. On unless a build sets VITE_MONETISATION=false;
   * the remote switch monetisation_enabled can also turn it off without a release.
   */
  monetisationEnabled: env.VITE_MONETISATION !== 'false',
  /** Games anyone can play without Plus. The remote switch free_formats can change the list. */
  freeFormats: ['word-guess', 'word-search', 'sudoku', 'logic-grid', 'circle-word'] as string[],
  /** Then Again Plus, shown before the store gives its local price. */
  plusPrice: '$0.99',
  /** Today's four stay free for everyone, so the daily habit, streak and hidden link never hit a paywall. */
  dailyFourAlwaysFree: true,
  /** Where players can email for help. Shown in Help when set (VITE_SUPPORT_EMAIL). */
  supportEmail: env.VITE_SUPPORT_EMAIL ?? '',
  /** Store pages, for the "please update" screen (VITE_APP_STORE_URL, VITE_PLAY_STORE_URL). */
  appStoreUrl: env.VITE_APP_STORE_URL ?? '',
  playStoreUrl: env.VITE_PLAY_STORE_URL ?? '',
  /** The full catalogue is an internal planning view, shown only in builds made with VITE_SHOW_CATALOGUE=true. */
  showCatalogue: env.VITE_SHOW_CATALOGUE === 'true',
} as const;
