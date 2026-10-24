/** App-wide switches and calendar anchors. */
export const config = {
  /** Local date of daily issue Nº 001. */
  issueEpoch: '2026-10-01',
  /** Monday on which the first theme in the seed rotation starts. */
  themeScheduleStart: '2026-09-07',
  /**
   * Gems, retries and the Collection Cabinet need the server-side wallet (phase 5), so they
   * stay hidden until it exists. Turn on with VITE_GEMS=true.
   */
  gemsEnabled: import.meta.env.VITE_GEMS === 'true',
  /** Purchases, Gem packs, Plus and adverts stay off during the free pilot (section 7). */
  monetisationEnabled: false,
  /** Where players can email for help. Shown in Help when set (VITE_SUPPORT_EMAIL). */
  supportEmail: (import.meta.env.VITE_SUPPORT_EMAIL as string | undefined) ?? '',
  /** Store pages, for the "please update" screen (VITE_APP_STORE_URL, VITE_PLAY_STORE_URL). */
  appStoreUrl: (import.meta.env.VITE_APP_STORE_URL as string | undefined) ?? '',
  playStoreUrl: (import.meta.env.VITE_PLAY_STORE_URL as string | undefined) ?? '',
  /** The full catalogue is an internal planning view; hide it before public release. */
  showCatalogue: import.meta.env.VITE_SHOW_CATALOGUE !== 'false',
} as const;
