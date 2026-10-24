// Builds the word lists from SCOWL (via wordlist-english).
//   src/content/dictionary/words.txt  every word of 4 to 7 letters; the app accepts these as guesses.
//   content/source/common-words.txt   common words of 4 to 9 letters; generators accept these in answer lists.
//   content/source/everyday-words.txt the most familiar words; generators pick headline answers from these.
// Run with: npm run dictionary
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const dir = dirname(require.resolve('wordlist-english/package.json'));
// Shared English plus US and UK spellings, for the first markets.
const DIALECTS = ['english', 'american', 'british'];

function collect(levels, min, max) {
  const words = new Set();
  for (const d of DIALECTS) {
    for (const l of levels) {
      for (const w of JSON.parse(readFileSync(join(dir, `${d}-words-${l}.json`), 'utf8'))) {
        // Lowercase letters only: drops proper nouns, abbreviations and apostrophes.
        if (/^[a-z]+$/.test(w) && w.length >= min && w.length <= max) words.add(w.toUpperCase());
      }
    }
  }
  return [...words].sort();
}

function write(path, words, label) {
  const url = new URL(path, import.meta.url);
  mkdirSync(dirname(url.pathname), { recursive: true });
  writeFileSync(url, words.join('\n') + '\n');
  console.log(`Wrote ${words.length} ${label} to ${url.pathname}`);
}

// Every frequency level: a real but rare word should never be rejected as a guess.
write('../src/content/dictionary/words.txt', collect([10, 20, 35, 40, 50, 55, 60, 70], 4, 7), 'accepted words (4 to 7 letters)');
// Levels up to 35 are the words most people use and recognise.
write('../content/source/common-words.txt', collect([10, 20, 35], 4, 9), 'common words (4 to 9 letters)');
// Levels up to 20 are the most familiar, for answers like Word Guess's.
write('../content/source/everyday-words.txt', collect([10, 20], 4, 9), 'everyday words (4 to 9 letters)');
