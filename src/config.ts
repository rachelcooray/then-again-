/** App-wide switches and calendar anchors. */
export const config = {
  /** Local date of daily issue Nº 001. */
  issueEpoch: '2026-10-01',
  /** Monday on which the first theme in the seed rotation starts. */
  themeScheduleStart: '2026-09-07',
  /** Purchases, Gem packs, Plus and adverts stay off during the free pilot (section 7). */
  monetisationEnabled: false,
  /** The full catalogue is an internal planning view; hide it before public release. */
  showCatalogue: import.meta.env.VITE_SHOW_CATALOGUE !== 'false',
} as const;
