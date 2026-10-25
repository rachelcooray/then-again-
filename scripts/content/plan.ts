/**
 * Builds the daily calendar: a fresh puzzle for every generated format on every day, plus
 * the day's set of four. Run with `npm run content -- [first-date] [days]`.
 *
 * - Difficulty follows the week: Monday and Tuesday easy, Wednesday and Thursday medium,
 *   Friday and Saturday hard, Sunday medium.
 * - Every puzzle goes through the gate; rejected ones are replaced with another seed.
 * - Answers don't come back within each format's window (see WINDOW).
 * - The day's four mix families and avoid repeating yesterday's formats.
 *
 * Output: one sealed file per day in src/content/generated/days/, an index in
 * src/content/generated/manifest.json, and content/reports/ with every check and a runway report.
 * The same first date and length always produce the same calendar.
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { getFormat } from '../../src/content/formats';
import { sealDay } from '../../src/content/schedule-codec';
import type { ScheduledDay } from '../../src/content/schedule';
import { themeForDate } from '../../src/content/themes';
import type { Puzzle } from '../../src/engines/types';
import { addDays, weekdayIndex } from '../../src/lib/date';
import { gate, type GateResult } from './gate';
import * as grids from './generators/grids';
import * as numbers from './generators/numbers';
import type { Draft, Level } from './generators/types';
import * as words from './generators/words';
import { hashString, rng, type Rng } from './rng';

type Generator = (r: Rng, level: Level, ctx: words.WordContext) => Draft | null;

/** Generated formats, in the order they are made each day (Word Guess first, so the others can avoid its answer). */
const GENERATORS: Record<string, Generator> = {
  'word-guess': words.wordGuess,
  'word-search': words.wordSearch,
  anagrams: words.anagrams,
  bingo: words.bingo,
  'circle-word': words.circleWord,
  'word-hive': words.wordHive,
  'word-ladder': words.wordLadder,
  sudoku: numbers.sudoku,
  'mini-sudoku': numbers.miniSudoku,
  'killer-sudoku': numbers.killerSudoku,
  futoshiki: numbers.futoshiki,
  kakuro: numbers.kakuro,
  nonogram: grids.nonogram,
  minesweeper: grids.minesweeper,
  'sliding-tile': grids.slidingTile,
  'logic-grid': grids.logicGrid,
};

/** These need written text (questions, facts, clues, groups), so they wait for the writing pipeline. */
const NEEDS_WRITING = ['rewind', 'mini-crossword', 'quiz', 'higher-lower', 'mystery-object', 'put-in-order'];

/** Days before an answer may come back in the same format. */
const WINDOW: Record<string, number> = {
  'word-guess': 45, // a theme returns after seven weeks, so its words can too
  'word-search': 2, // each theme has about twenty words for six a day
  anagrams: 21,
  bingo: 1,
  nonogram: 14, // the picture library is still small
};
const DEFAULT_WINDOW = 60;

const LEVEL_BY_WEEKDAY: Level[] = [1, 1, 2, 2, 3, 3, 2];
const LEVEL_NAME = { 1: 'Easy', 2: 'Medium', 3: 'Hard' } as const;

const SLOTS = {
  word: ['word-guess', 'circle-word', 'word-ladder', 'anagrams', 'word-hive'],
  logic: ['sudoku', 'mini-sudoku', 'killer-sudoku', 'futoshiki', 'kakuro', 'nonogram', 'minesweeper', 'sliding-tile', 'logic-grid'],
};

const first = process.argv[2] ?? '2026-10-19';
const length = Number(process.argv[3] ?? 90);

const lastUsed = new Map<string, Map<string, string>>(); // format → answer → date
const lastInSet = new Map<string, string>(); // format → last date in a day's four
const lastFeatured = new Map<string, string>(); // family → last date featured
const report: { date: string; formatId: string; level: Level; status: GateResult['status']; checks: GateResult['checks']; seedTries: number; note?: string }[] = [];
const days: Record<string, ScheduledDay> = {};
const gaps: string[] = [];
const timing = new Map<string, number>(); // format → milliseconds spent generating
const review = new Map<string, number>(); // format → scheduled puzzles waiting for review

const daysSince = (from: string | undefined, to: string) => (from ? (Date.parse(to) - Date.parse(from)) / 86400000 : Infinity);

function makePuzzle(date: string, formatId: string, level: Level, ctx: Omit<words.WordContext, 'fresh'>): Puzzle | null {
  const window = WINDOW[formatId] ?? DEFAULT_WINDOW;
  const used = lastUsed.get(formatId) ?? new Map<string, string>();
  const fresh = (a: string) => daysSince(used.get(a), date) >= window;
  // Some generators can't always reach a hard puzzle; step down a level rather than leave a gap.
  for (const tryLevel of [level, level - 1, level - 2].filter((l) => l >= 1) as Level[]) {
    for (let k = 0; k < 6; k++) {
      const draft = GENERATORS[formatId](rng(hashString(`${date}:${formatId}:${tryLevel}:${k}`)), tryLevel, { ...ctx, fresh });
      if (!draft || !draft.answers.every(fresh)) continue;
      const result = gate(draft);
      report.push({ date, formatId, level: tryLevel, status: result.status, checks: result.checks, seedTries: k + 1, note: tryLevel < level ? `stepped down from ${LEVEL_NAME[level]}` : undefined });
      if (result.status === 'rejected') continue;
      for (const a of draft.answers) used.set(a, date);
      lastUsed.set(formatId, used);
      if (result.status === 'needs-review') review.set(formatId, (review.get(formatId) ?? 0) + 1);
      const theme = themeForDate(date);
      return {
        id: `${formatId}-${date}`,
        formatId,
        memory: draft.memory ? { ...draft.memory, draft: !!draft.needsReview } : { title: theme.name, text: theme.description },
        level: tryLevel,
        payload: draft.payload,
      };
    }
  }
  // Small libraries (the nonogram pictures) can run out: repeat the least recent answer rather than leave a gap.
  if (window > 1 && formatId !== 'word-guess') {
    WINDOW[formatId] = 1;
    try {
      const p = makePuzzle(date, formatId, level, ctx);
      if (p) {
        report.at(-1)!.note = 'repeats an answer from inside its window';
        return p;
      }
    } finally {
      WINDOW[formatId] = window;
    }
  }
  gaps.push(`${date} ${formatId}`);
  return null;
}

/** Picks the format in a slot that has gone longest without being in the day's four. */
function pickFor(slot: string[], date: string, r: Rng, taken: string[], puzzles: Record<string, Puzzle>): string {
  const options = slot.filter((f) => puzzles[f] && !taken.includes(f));
  return options
    .map((f) => ({ f, wait: daysSince(lastInSet.get(f), date) + r.next() }))
    .sort((a, b) => b.wait - a.wait)[0].f;
}

for (let i = 0; i < length; i++) {
  const date = addDays(first, i);
  const theme = themeForDate(date);
  const level = LEVEL_BY_WEEKDAY[weekdayIndex(date)];
  const puzzles: Record<string, Puzzle> = {};
  const exclude = new Set<string>();
  for (const formatId of Object.keys(GENERATORS)) {
    const started = Date.now();
    const p = makePuzzle(date, formatId, level, { theme, exclude });
    timing.set(formatId, (timing.get(formatId) ?? 0) + Date.now() - started);
    if (!p) continue;
    puzzles[formatId] = p;
    if (formatId === 'word-guess') exclude.add((p.payload as { answer: string }).answer);
  }

  // The day's four: a word puzzle, the theme's word search, a logic puzzle, and one more:
  // Bingo when it hasn't been on for a few days, otherwise another word or logic puzzle.
  const r = rng(hashString(`set:${date}`));
  const set: string[] = [];
  set.push(pickFor(SLOTS.word, date, r, set, puzzles));
  if (puzzles['word-search']) set.push('word-search');
  set.push(pickFor(SLOTS.logic, date, r, set, puzzles));
  const fourth = puzzles.bingo && daysSince(lastInSet.get('bingo'), date) >= 3 ? 'bingo' : pickFor(r.next() < 0.5 ? SLOTS.word : SLOTS.logic, date, r, set, puzzles);
  set.push(fourth);
  for (const f of set) lastInSet.set(f, date);

  // Feature the family that has waited longest for the spotlight.
  const featured = set
    .map((f) => ({ f, wait: daysSince(lastFeatured.get(getFormat(f)!.family), date) + r.next() }))
    .sort((a, b) => b.wait - a.wait)[0].f;
  lastFeatured.set(getFormat(featured)!.family, date);
  const formats = [featured, ...set.filter((f) => f !== featured)];

  days[date] = { themeId: theme.id, level, formats, puzzles };
  process.stdout.write(`${date} ${LEVEL_NAME[level].padEnd(6)} ${formats.join(', ')}\n`);
}

// ---------------------------------------------------------------- Output

const outDir = new URL('../../src/content/generated/', import.meta.url);
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
mkdirSync(new URL('days/', outDir), { recursive: true });
for (const [date, day] of Object.entries(days)) writeFileSync(new URL(`days/${date}.json`, outDir), JSON.stringify(sealDay(date, day)) + '\n');
const last = addDays(first, length - 1);
writeFileSync(new URL('manifest.json', outDir), JSON.stringify({ first, last }, null, 2) + '\n');

const reportDir = new URL('../../content/reports/', import.meta.url);
mkdirSync(reportDir, { recursive: true });
writeFileSync(new URL('checks.json', reportDir), JSON.stringify(report, null, 1) + '\n');

const count = (s: GateResult['status']) => report.filter((x) => x.status === s).length;
const scheduled = Object.values(days).reduce((n, d) => n + Object.keys(d.puzzles).length, 0);
const stepped = report.filter((x) => x.note && x.status !== 'rejected');
const md = `# Content runway

Generated by \`npm run content\` for ${first} to ${last} (${length} days).

## Summary

- Days scheduled: ${length}, through **${last}**. After that date the app falls back to the design puzzles, so run the generator again well before then.
- Puzzles scheduled: ${scheduled} across ${Object.keys(GENERATORS).length} formats.
- Gate results: ${count('approved')} approved, ${count('needs-review')} need review, ${count('rejected')} rejected and replaced.
- Gaps (no puzzle could be made): ${gaps.length ? gaps.join('; ') : 'none'}.
- Repeated an answer early: ${report.filter((x) => x.note?.startsWith('repeats')).map((x) => `${x.date} ${x.formatId}`).join('; ') || 'none'}.
- Stepped down a level: ${stepped.length ? stepped.map((x) => `${x.date} ${x.formatId}`).join('; ') : 'none'}.

## Waiting for review

These are scheduled but carry text a person wrote and nobody has checked yet: theme clues and
nonogram pictures. Check \`scripts/content/theme-words.ts\` and \`scripts/content/generators/pictures.ts\`.

${[...review].map(([f, n]) => `- ${getFormat(f)!.name}: ${n} puzzles`).join('\n')}

## Not generated yet

These formats need written questions, facts, clues or groups. Until a writing provider and
reviewers are chosen (section 12), they play the design puzzle every day and are never in the day's four:

${NEEDS_WRITING.map((f) => `- ${getFormat(f)!.name}`).join('\n')}
`;
writeFileSync(new URL('runway.md', reportDir), md);
console.log('\nSeconds per format:', [...timing].sort((x, y) => y[1] - x[1]).map(([f, ms]) => `${f} ${(ms / 1000).toFixed(1)}`).join(', '));
console.log(`\n${scheduled} puzzles, ${count('rejected')} rejected, ${gaps.length} gaps. Report: content/reports/runway.md`);
