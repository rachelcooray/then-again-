let cache: Promise<ReadonlySet<string>> | null = null;

/** The word-game dictionary (SCOWL, 4 to 7 letters), loaded once and only when a word game opens. */
export function loadDictionary(): Promise<ReadonlySet<string>> {
  cache ??= import('./words.txt?raw')
    .then((m) => new Set(m.default.split('\n').filter(Boolean)) as ReadonlySet<string>)
    .catch((e) => {
      cache = null;
      throw e;
    });
  return cache;
}
