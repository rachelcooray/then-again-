import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const read = (path: string) =>
  readFileSync(new URL(path, import.meta.url), 'utf8').split('\n').map((w) => w.trim()).filter(Boolean);

/** Every word the app accepts as a guess (4 to 7 letters). */
export const accepted: ReadonlySet<string> = new Set(read('../../src/content/dictionary/words.txt'));
/** Common words; answer lists may include these. */
export const common: ReadonlySet<string> = new Set(read('../../content/source/common-words.txt'));
/** The most familiar words; headline answers come from these. */
export const everyday: ReadonlySet<string> = new Set(read('../../content/source/everyday-words.txt'));

/**
 * Words that must never appear: the open LDNOOBW list plus our own additions in
 * content/source/blocklist-extra.txt (one word per line; add anything a reviewer flags).
 */
export const blocklist: ReadonlySet<string> = new Set([
  ...(require('naughty-words').en as string[]).filter((w) => /^[a-z]+$/i.test(w)).map((w) => w.toUpperCase()),
  ...read('../../content/source/blocklist-extra.txt').filter((w) => !w.startsWith('#')).map((w) => w.toUpperCase()),
]);

export const ofLength = (set: ReadonlySet<string>, n: number) => [...set].filter((w) => w.length === n);

/** Too grim or awkward to be an answer (content/source/answer-avoid.txt), though still accepted as guesses. */
export const avoid: ReadonlySet<string> = new Set(read('../../content/source/answer-avoid.txt').filter((w) => !w.startsWith('#')));

/** Fit to be an answer: accepted, not blocked and not on the avoid list. */
export const answerable = (w: string) => accepted.has(w) && !blocklist.has(w) && !avoid.has(w);

/** Plurals and past tenses make dull headline answers. */
export const looksInflected = (w: string) => (/S$/.test(w) && !/SS$/.test(w)) || /ED$/.test(w);
