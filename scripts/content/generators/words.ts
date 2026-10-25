import { earliestLine, FREE, type CardPayload } from '../../../src/engines/card/logic';
import type { WordSearchPayload } from '../../../src/engines/letter-grid-search/logic';
import type { LetterGuessPayload } from '../../../src/engines/letter-guess/logic';
import type { LetterSetPayload } from '../../../src/engines/letter-set';
import type { AnagramsPayload } from '../../../src/engines/letter-set/anagrams';
import type { WordHivePayload } from '../../../src/engines/letter-set/hive-logic';
import type { WordChainPayload } from '../../../src/engines/word-chain/logic';
import type { Rng } from '../rng';
import { hiddenWordsInGrid } from '../safety';
import { labelOf, THEME_WORDS, type ThemeWord } from '../theme-words';
import { accepted, answerable, common, everyday, looksInflected, ofLength } from '../words';
import type { Draft, Level } from './types';

/** What a word generator needs to know about the day. */
export interface WordContext {
  theme: { id: string; name: string };
  /** False if this answer was used too recently for this format. */
  fresh: (answer: string) => boolean;
  /** Words another puzzle on the same day is about, so this one mustn't give them away. */
  exclude?: ReadonlySet<string>;
}

const themeWords = (ctx: WordContext): ThemeWord[] => (THEME_WORDS[ctx.theme.id] ?? []).filter((t) => !ctx.exclude?.has(t.word));
/** Marble and Marbles, or Card and Cards, shouldn't share a card. */
const nearSame = (a: string, b: string) => a.toUpperCase().startsWith(b.toUpperCase()) || b.toUpperCase().startsWith(a.toUpperCase());
const NUMBERS = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];

/** Everyday words of a length that make good answers. */
const everydayAnswers = (n: number) => ofLength(everyday, n).filter((w) => answerable(w) && !looksInflected(w));

const sortLetters = (w: string) => w.split('').sort().join('');
/** Accepted words grouped by their letters, to check an anagram has only one answer. */
const ANAGRAM_GROUPS = (() => {
  const m = new Map<string, number>();
  for (const w of accepted) m.set(sortLetters(w), (m.get(sortLetters(w)) ?? 0) + 1);
  return m;
})();
const oneAnagram = (w: string) => ANAGRAM_GROUPS.get(sortLetters(w)) === 1;

// ---------------------------------------------------------------- Word Search

const DIRECTIONS: Record<Level, [number, number][]> = {
  1: [[0, 1], [1, 0]],
  2: [[0, 1], [1, 0], [1, 1], [-1, 1]],
  3: [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1]],
};
const ALL_DIRECTIONS = DIRECTIONS[3];
// Filler letters roughly follow English letter frequency, so the grid doesn't look random.
const FILL = 'EEEEEEAAAAARRRRIIIIOOOOTTTTNNNNSSSSLLLCCCUUUDDPPMMHHGGBBFYWKV';

/** How many times a word reads in the grid, in any direction. */
function occurrences(letters: string, cols: number, word: string): number {
  const rows = letters.length / cols;
  let n = 0;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      for (const [dr, dc] of ALL_DIRECTIONS) {
        let k = 0;
        for (let rr = r, cc = c; k < word.length && rr >= 0 && cc >= 0 && rr < rows && cc < cols; rr += dr, cc += dc, k++) {
          if (letters[rr * cols + cc] !== word[k]) break;
        }
        if (k === word.length) n++;
      }
  return n;
}

export function wordSearch(r: Rng, level: Level, ctx: WordContext): Draft<WordSearchPayload> | null {
  const cols = 8;
  const count = level === 3 ? 7 : 6;
  const pool = themeWords(ctx).filter((t) => t.word.length >= 4 && t.word.length <= cols);
  if (pool.length < count) return null;
  for (let attempt = 0; attempt < 400; attempt++) {
    const picked = r.shuffle(pool).slice(0, count).map((t) => t.word).sort((a, b) => b.length - a.length);
    const grid: string[] = Array(cols * cols).fill('');
    const placed: WordSearchPayload['words'] = [];
    for (const word of picked) {
      let done = false;
      for (let tries = 0; tries < 200 && !done; tries++) {
        const [dr, dc] = r.pick(DIRECTIONS[level]);
        const r0 = r.int(cols);
        const c0 = r.int(cols);
        const r1 = r0 + dr * (word.length - 1);
        const c1 = c0 + dc * (word.length - 1);
        if (r1 < 0 || r1 >= cols || c1 < 0 || c1 >= cols) continue;
        const cells = Array.from({ length: word.length }, (_, k) => (r0 + dr * k) * cols + c0 + dc * k);
        if (cells.some((i, k) => grid[i] && grid[i] !== word[k])) continue;
        cells.forEach((i, k) => (grid[i] = word[k]));
        placed.push({ word, start: cells[0], end: cells[cells.length - 1] });
        done = true;
      }
      if (!done) break;
    }
    if (placed.length < count) continue;
    const letters = grid.map((ch) => ch || r.pick(FILL.split(''))).join('');
    if (picked.some((w) => occurrences(letters, cols, w) !== 1)) continue;
    if (hiddenWordsInGrid(letters, cols).length) continue;
    if (!picked.every(ctx.fresh)) continue;
    return {
      formatId: 'word-search',
      level,
      payload: { cols, letters, words: placed, intro: `${NUMBERS[count]} words from “${ctx.theme.name}”.${level === 3 ? ' Some run backwards.' : ''}` },
      answers: picked,
      needsReview: 'Theme words written by hand.',
    };
  }
  return null;
}

// ---------------------------------------------------------------- Word Guess

/** Easy and medium days use a theme word with its clue; hard days give no clue. */
export function wordGuess(r: Rng, level: Level, ctx: WordContext): Draft<LetterGuessPayload> | null {
  const themed = r.shuffle(themeWords(ctx).filter((t) => t.word.length === 5 && answerable(t.word) && ctx.fresh(t.word)));
  if (level < 3 && themed.length) {
    const t = themed[0];
    return { formatId: 'word-guess', level, payload: { answer: t.word, clue: t.clue }, answers: [t.word], needsReview: 'Clue written by hand.' };
  }
  const plain = r.shuffle(everydayAnswers(5).filter(ctx.fresh));
  if (!plain.length) return null;
  const w = plain[0];
  const clue = level < 3 ? `It starts with ${w[0]}.` : '';
  return { formatId: 'word-guess', level, payload: { answer: w, clue }, answers: [w] };
}

// ---------------------------------------------------------------- Anagrams

const ANAGRAM_LENGTHS: Record<Level, number[]> = { 1: [4, 5, 5, 5, 6], 2: [5, 5, 6, 6, 7], 3: [6, 6, 7, 7, 7] };

function scramble(r: Rng, word: string, keepFirst: boolean): string {
  for (let k = 0; k < 50; k++) {
    const rest = keepFirst ? word.slice(1) : word;
    const s = (keepFirst ? word[0] : '') + r.shuffle(rest.split('')).join('');
    if (s !== word && !accepted.has(s)) return s;
  }
  return word.split('').reverse().join('');
}

/** Five rounds; theme words come with their clue, others are plain. Easy days keep the first letter in place. */
export function anagrams(r: Rng, level: Level, ctx: WordContext): Draft<AnagramsPayload> | null {
  const used = new Set<string>();
  const usable = (w: string) => answerable(w) && oneAnagram(w) && ctx.fresh(w) && !used.has(w);
  const rounds: AnagramsPayload['rounds'] = [];
  let themed = 0;
  for (const n of ANAGRAM_LENGTHS[level]) {
    const t = r.shuffle(themeWords(ctx)).find((x) => x.word.length === n && usable(x.word));
    const word = t?.word ?? r.shuffle(everydayAnswers(n)).find((w) => usable(w) && !ctx.exclude?.has(w));
    if (!word) return null;
    used.add(word);
    if (t) themed++;
    rounds.push({ letters: scramble(r, word, level === 1), answer: word, clue: t?.clue ?? '' });
  }
  return {
    formatId: 'anagrams',
    level,
    payload: { rounds, goal: 3, intro: level === 1 ? 'Unscramble five words. The first letter is already in place.' : 'Unscramble five words.' },
    answers: rounds.map((x) => x.answer),
    needsReview: themed ? 'Clues written by hand.' : undefined,
  };
}

// ---------------------------------------------------------------- Circle Word Finder

function fitsLetters(word: string, letters: string): boolean {
  const left = letters.split('');
  for (const ch of word) {
    const i = left.indexOf(ch);
    if (i < 0) return false;
    left.splice(i, 1);
  }
  return true;
}

export function circleWord(r: Rng, level: Level, ctx: WordContext): Draft<LetterSetPayload> | null {
  const size = level === 1 ? 6 : 7;
  const total = { 1: 6, 2: 8, 3: 10 }[level];
  const minLength = 4;
  const words = [...everyday].filter((w) => w.length >= minLength && w.length <= size && answerable(w));
  for (const base of r.shuffle(everydayAnswers(size)).slice(0, 300)) {
    if (!ctx.fresh(base)) continue;
    const subs = words.filter((w) => w !== base && fitsLetters(w, base) && !looksInflected(w));
    if (subs.length < total - 1) continue;
    // Harder days ask for the longer words.
    const chosen = (level === 3 ? r.shuffle(subs).sort((a, b) => b.length - a.length) : r.shuffle(subs)).slice(0, total - 1);
    const targets = [base, ...chosen.sort((a, b) => b.length - a.length || a.localeCompare(b))];
    return {
      formatId: 'circle-word',
      level,
      payload: { letters: r.shuffle(base.split('')), targets, minLength, intro: `Find ${NUMBERS[total].toLowerCase()} words, including the one that uses every letter.` },
      answers: [base],
    };
  }
  return null;
}

// ---------------------------------------------------------------- Word Hive

const HIVE_POOL = [...new Set([...common, ...everyday])].filter((w) => w.length >= 4);

export function wordHive(r: Rng, level: Level, ctx: WordContext): Draft<WordHivePayload> | null {
  // Easy days have lots of words to find; hard days have fewer.
  const [lo, hi] = { 1: [30, 60], 2: [20, 35], 3: [14, 24] }[level];
  const goal = { 1: 8, 2: 12, 3: 14 }[level];
  const bases = everydayAnswers(7).filter((w) => new Set(w).size === 7 && !w.includes('S'));
  for (const base of r.shuffle(bases).slice(0, 400)) {
    const set = [...new Set(base)];
    const key = sortLetters(base);
    if (!ctx.fresh(key)) continue;
    const inSet = HIVE_POOL.filter((w) => [...w].every((ch) => set.includes(ch)) && answerable(w));
    for (const centre of r.shuffle(set)) {
      const list = inSet.filter((w) => w.includes(centre));
      if (list.length < lo || list.length > hi) continue;
      const pangrams = list.filter((w) => set.every((ch) => w.includes(ch)));
      return {
        formatId: 'word-hive',
        level,
        payload: {
          centre,
          ring: r.shuffle(set.filter((ch) => ch !== centre)),
          words: list.sort(),
          pangrams,
          goal: Math.min(goal, Math.floor(list.length / 2)),
          minLength: 4,
          intro: 'Letters can repeat, and at least one word uses all seven.',
        },
        answers: [key],
      };
    }
  }
  return null;
}

// ---------------------------------------------------------------- Word Ladder

/** Words one letter apart, found through shared patterns like "C_LD". */
function neighbours(words: readonly string[]): Map<string, string[]> {
  const buckets = new Map<string, string[]>();
  for (const w of words)
    for (let i = 0; i < w.length; i++) {
      const k = w.slice(0, i) + '_' + w.slice(i + 1);
      buckets.set(k, [...(buckets.get(k) ?? []), w]);
    }
  const out = new Map<string, string[]>();
  for (const w of words) {
    const set = new Set<string>();
    for (let i = 0; i < w.length; i++) for (const x of buckets.get(w.slice(0, i) + '_' + w.slice(i + 1))!) if (x !== w) set.add(x);
    out.set(w, [...set]);
  }
  return out;
}

function distances(from: string, graph: Map<string, string[]>): Map<string, string | null> {
  const prev = new Map<string, string | null>([[from, null]]);
  let layer = [from];
  while (layer.length) {
    const next: string[] = [];
    for (const w of layer) for (const x of graph.get(w) ?? []) if (!prev.has(x)) (prev.set(x, w), next.push(x));
    layer = next;
  }
  return prev;
}

const pathTo = (end: string, prev: Map<string, string | null>) => {
  const path = [end];
  for (let p = prev.get(end); p; p = prev.get(p)) path.unshift(p);
  return path;
};

let ladderGraphs: { route: Map<string, string[]>; all: Map<string, string[]> } | null = null;

/** Start and end are everyday words; every step on the shown route is too. Par is the true fewest steps. */
export function wordLadder(r: Rng, level: Level, ctx: WordContext): Draft<WordChainPayload> | null {
  ladderGraphs ??= {
    route: neighbours(ofLength(everyday, 4).filter(answerable)),
    all: neighbours(ofLength(accepted, 4)),
  };
  const steps = { 1: 3, 2: 4, 3: 5 }[level];
  const ends = new Set(everydayAnswers(4));
  for (const start of r.shuffle([...ends]).slice(0, 300)) {
    const easy = distances(start, ladderGraphs.route);
    const any = distances(start, ladderGraphs.all);
    const options = [...easy.keys()].filter((w) => ends.has(w) && pathTo(w, easy).length === steps + 1 && pathTo(w, any).length === steps + 1);
    for (const end of r.shuffle(options)) {
      if (!ctx.fresh(start + end)) continue;
      return {
        formatId: 'word-ladder',
        level,
        payload: { start, end, par: steps, route: pathTo(end, easy), intro: `Turn ${start} into ${end}.` },
        answers: [start + end],
      };
    }
  }
  return null;
}

// ---------------------------------------------------------------- Daily Bingo

/** The card mixes theme things with things from other weeks; harder days take longer to make a line. */
export function bingo(r: Rng, level: Level, ctx: WordContext): Draft<CardPayload> | null {
  const mine = themeWords(ctx).map(labelOf);
  const others: string[] = [];
  for (const [id, ws] of Object.entries(THEME_WORDS)) {
    if (id === ctx.theme.id) continue;
    for (const w of ws) {
      const l = labelOf(w);
      if (![...mine, ...others].some((x) => nearSame(x, l)) && !ctx.exclude?.has(w.word)) others.push(l);
    }
  }
  const [lo, hi] = { 1: [12, 17], 2: [18, 21], 3: [22, 24] }[level];
  const maxCalls = 24;
  for (let attempt = 0; attempt < 2000; attempt++) {
    const fromTheme = r.shuffle(mine).slice(0, Math.min(16, mine.length));
    const items = r.shuffle([...fromTheme, ...r.shuffle(others).slice(0, 24 - fromTheme.length)]);
    const card = [...items.slice(0, 12), FREE, ...items.slice(12)];
    const decoys = r.shuffle(others.filter((o) => !items.includes(o))).slice(0, 8);
    const calls = r.shuffle([...r.shuffle(items).slice(0, 22), ...decoys]);
    const p: CardPayload = { card, calls, maxCalls, intro: `Tap a square once it’s been called. Complete any row, column or diagonal within ${maxCalls} calls.` };
    const first = earliestLine(p);
    if (first < lo || first > hi) continue;
    return { formatId: 'bingo', level, payload: p, answers: [card.join()], needsReview: 'Theme words written by hand.' };
  }
  return null;
}
