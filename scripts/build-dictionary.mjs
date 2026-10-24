// Builds the on-device dictionary for word games from SCOWL (via wordlist-english).
// Run with: node scripts/build-dictionary.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const dir = dirname(require.resolve('wordlist-english/package.json'));

// Every frequency level: a real but rare word should never be rejected as a guess.
const LEVELS = [10, 20, 35, 40, 50, 55, 60, 70];
// Shared English plus US and UK spellings, for the first markets.
const DIALECTS = ['english', 'american', 'british'];
const MIN = 4;
const MAX = 7;

const words = new Set();
for (const d of DIALECTS) {
  for (const l of LEVELS) {
    for (const w of JSON.parse(readFileSync(join(dir, `${d}-words-${l}.json`), 'utf8'))) {
      // Lowercase letters only: drops proper nouns, abbreviations and apostrophes.
      if (/^[a-z]+$/.test(w) && w.length >= MIN && w.length <= MAX) words.add(w.toUpperCase());
    }
  }
}

const out = [...words].sort();
const target = new URL('../src/content/dictionary/words.txt', import.meta.url);
writeFileSync(target, out.join('\n') + '\n');
console.log(`Wrote ${out.length} words (${MIN} to ${MAX} letters) to ${target.pathname}`);
