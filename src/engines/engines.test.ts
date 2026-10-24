import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { FORMATS } from '../content/formats';
import { getPuzzle } from '../content/puzzles';
import { card, earliestLine, FREE, type CardPayload } from './card';
import { grouping, type GroupingPayload } from './grouping';
import { letterGridSearch, wordPath, type WordSearchPayload } from './letter-grid-search';
import { letterGuess } from './letter-guess';
import { scoreGuess, type LetterGuessPayload } from './letter-guess/logic';
import { letterSet, type LetterSetPayload } from './letter-set';
import { logicGrid, solveLogicGrid, type LogicGridPayload } from './logic-grid';
import { numberGrid, type NumberGridPayload } from './number-grid';
import { countSolutions } from './number-grid/solver';
import { ENGINES } from './registry';
import type { AnyEngine, EngineContext } from './types';

const dictionary: ReadonlySet<string> = new Set(
  readFileSync(join(__dirname, '../content/dictionary/words.txt'), 'utf8').split('\n').filter(Boolean),
);
const ctx: EngineContext = { dictionary };

const D = '2026-10-24';
const payload = <P>(formatId: string) => getPuzzle(D, formatId)!.payload as P;

/** Runs actions through an engine and returns the final state and status. */
function play<P>(engine: AnyEngine, p: P, actions: unknown[]) {
  let s = engine.init(p);
  for (const a of actions) s = engine.reduce(s, a, p, ctx);
  return { s, status: engine.status(s, p) };
}

describe('phase 2 formats', () => {
  it('have an engine and a puzzle', () => {
    for (const id of ['word-guess', 'word-search', 'sudoku', 'rewind', 'circle-word', 'bingo', 'logic-grid']) {
      const f = FORMATS.find((x) => x.id === id)!;
      expect(ENGINES[f.engine], id).toBeDefined();
      expect(getPuzzle(D, id), id).toBeDefined();
    }
  });
});

describe('Word Guess', () => {
  const p = payload<LetterGuessPayload>('word-guess');
  const type = (w: string) => [...w.split('').map((letter) => ({ type: 'letter', letter })), { type: 'enter' }];

  it('uses a real word as the answer', () => {
    expect(dictionary.has(p.answer)).toBe(true);
  });

  it('scores repeated letters correctly', () => {
    expect(scoreGuess('LLAMA', 'CHALK')).toEqual(['present', 'absent', 'correct', 'absent', 'absent']);
    expect(scoreGuess('CHALK', 'CHALK').every((m) => m === 'correct')).toBe(true);
  });

  it('rejects words that aren’t in the dictionary and short guesses', () => {
    // A rejected word stays on the row so it can be edited.
    const clear = Array.from({ length: 5 }, () => ({ type: 'delete' }));
    const { s, status } = play(letterGuess, p, [...type('ZZZZZ'), ...clear, ...type('CHA')]);
    expect(s.guesses).toEqual([]);
    expect(status.message).toMatch(/5 letters/);
    expect(play(letterGuess, p, type('ZZZZZ')).status.message).toMatch(/isn’t in our word list/);
  });

  it('can be won', () => {
    const { status } = play(letterGuess, p, [...type('PLANT'), ...type('CHALK')]);
    expect(status).toMatchObject({ done: true, solved: true, score: '2/6' });
  });

  it('can be lost after six guesses', () => {
    const { s, status } = play(letterGuess, p, ['PLANT', 'BRICK', 'STONE', 'MOUSE', 'TRAIN', 'GHOST'].flatMap(type));
    expect(status).toMatchObject({ done: true, solved: false, score: 'X/6' });
    expect(status.message).toMatch(/CHALK/);
    expect(letterGuess.reduce(s, { type: 'letter', letter: 'A' }, p, ctx)).toBe(s);
  });
});

describe('Word Search', () => {
  const p = payload<WordSearchPayload>('word-search');

  it('places every word on a straight line that spells it', () => {
    for (const w of p.words) {
      const cells = wordPath(w, p.cols);
      expect(cells, w.word).not.toBeNull();
      expect(cells!.map((i) => p.letters[i]).join('')).toBe(w.word);
    }
  });

  it('can be won by tapping first and last letters, in either order', () => {
    const actions = p.words.flatMap((w, k) => k % 2 ? [{ type: 'tap', index: w.end }, { type: 'tap', index: w.start }] : [{ type: 'tap', index: w.start }, { type: 'tap', index: w.end }]);
    expect(play(letterGridSearch, p, actions).status).toMatchObject({ done: true, solved: true, score: '6/6' });
  });

  it('rejects a wrong pair and can be lost by showing the answers', () => {
    const { s } = play(letterGridSearch, p, [{ type: 'tap', index: 0 }, { type: 'tap', index: 1 }]);
    expect(s.found).toEqual([]);
    expect(play(letterGridSearch, p, [{ type: 'reveal' }]).status).toMatchObject({ done: true, solved: false });
  });

  it('gives one free hint', () => {
    const { s } = play(letterGridSearch, p, [{ type: 'hint' }, { type: 'hint' }]);
    expect(s.hintsUsed).toBe(1);
    expect(s.hinted).toBe(p.words[0].start);
  });
});

describe('Sudoku', () => {
  const p = payload<NumberGridPayload>('sudoku');
  const givens = p.givens.split('').map(Number);
  const sol = p.solution.split('').map(Number);

  it('has exactly one solution, and it is the stored one', () => {
    expect(countSolutions(givens, p)).toBe(1);
    expect(countSolutions(sol, p)).toBe(1);
    givens.forEach((g, i) => g && expect(g).toBe(sol[i]));
  });

  it('can tell a puzzle with two solutions', () => {
    const loose = givens.slice();
    loose.forEach((_, i) => i < 40 && (loose[i] = 0));
    expect(countSolutions(loose, p)).toBe(2);
  });

  it('can be won, keeps givens fixed and flags wrong numbers', () => {
    const empties = givens.map((g, i) => (g ? -1 : i)).filter((i) => i >= 0);
    const given = givens.findIndex((g) => g);
    const blocked = play(numberGrid, p, [{ type: 'select', index: given }, { type: 'put', value: 9 }]);
    expect(blocked.s.values[given]).toBe(givens[given]);

    const wrongValue = (sol[empties[0]] % 9) + 1;
    const checked = play(numberGrid, p, [{ type: 'select', index: empties[0] }, { type: 'put', value: wrongValue }, { type: 'check' }]);
    expect(checked.s.wrong).toEqual([empties[0]]);

    const solved = play(numberGrid, p, empties.flatMap((i) => [{ type: 'select', index: i }, { type: 'put', value: sol[i] }]));
    expect(solved.status).toMatchObject({ done: true, solved: true, score: 'Solved' });
  });

  it('can be lost by showing the answers', () => {
    expect(play(numberGrid, p, [{ type: 'reveal' }]).status).toMatchObject({ done: true, solved: false });
  });
});

describe('Rewind', () => {
  const p = payload<GroupingPayload>('rewind');
  const pick = (items: string[]) => [...items.map((item) => ({ type: 'toggle', item })), { type: 'check' }];

  it('has four groups of four, all shown once', () => {
    expect(p.groups).toHaveLength(4);
    const all = p.groups.flatMap((g) => g.items);
    expect(new Set(all).size).toBe(16);
    expect([...p.order].sort()).toEqual([...all].sort());
  });

  it('can be won', () => {
    const { status } = play(grouping, p, p.groups.flatMap((g) => pick(g.items)));
    expect(status).toMatchObject({ done: true, solved: true, score: '0 mistakes' });
  });

  it('says “one away” and can be lost after four mistakes', () => {
    const [a, b] = p.groups;
    const oneAway = [...a.items.slice(0, 3), b.items[0]];
    expect(play(grouping, p, pick(oneAway)).status.message).toMatch(/One away/);
    const { status } = play(grouping, p, [1, 2, 3, 4].flatMap(() => [...pick(oneAway), { type: 'clear' }]));
    expect(status).toMatchObject({ done: true, solved: false, score: '0/4' });
  });
});

describe('Circle Word Finder', () => {
  const p = payload<LetterSetPayload>('circle-word');
  const spell = (w: string) => [...w.split('').map((letter) => ({ type: 'typed', letter })), { type: 'submit' }];

  it('only asks for real words that the letters can make', () => {
    for (const t of p.targets) {
      expect(dictionary.has(t), t).toBe(true);
      const pool = [...p.letters];
      for (const ch of t) {
        const i = pool.indexOf(ch);
        expect(i, `${t} uses ${ch}`).toBeGreaterThanOrEqual(0);
        pool.splice(i, 1);
      }
    }
  });

  it('accepts bonus words from the dictionary and rejects made-up ones', () => {
    const { s } = play(letterSet, p, [...spell('PINE'), ...spell('PLIC'), ...spell('PIN')]);
    expect(s.found).toEqual(['PINE']);
    expect(s.note).toMatch(/four letters|4 letters/);
  });

  it('can be won and lost', () => {
    expect(play(letterSet, p, p.targets.flatMap(spell)).status).toMatchObject({ done: true, solved: true, score: '8/8' });
    expect(play(letterSet, p, [...spell('SNIP'), { type: 'reveal' }]).status).toMatchObject({ done: true, solved: false, score: '1/8' });
  });
});

describe('Daily Bingo', () => {
  const p = payload<CardPayload>('bingo');
  const markAll = (n: number) => p.card.map((t, i) => (p.calls.slice(0, n).includes(t) && t !== FREE ? { type: 'mark', index: i } : null)).filter(Boolean);

  it('makes a line possible within the call limit', () => {
    expect(p.card).toHaveLength(25);
    expect(p.card[12]).toBe(FREE);
    expect(earliestLine(p)).toBeLessThanOrEqual(p.maxCalls);
  });

  it('only lets called items be marked', () => {
    const { s } = play(card, p, [{ type: 'mark', index: 0 }]);
    expect(s.marked).toEqual([12]);
    expect(s.note).toMatch(/hasn’t been called/);
  });

  it('can be won', () => {
    const n = earliestLine(p);
    const calls = Array.from({ length: n }, () => ({ type: 'call' }));
    expect(play(card, p, [...calls, ...markAll(n)]).status).toMatchObject({ done: true, solved: true, score: `${n} calls` });
  });

  it('can be lost by running out of calls without a line', () => {
    const calls = Array.from({ length: p.maxCalls + 3 }, () => ({ type: 'call' }));
    const { s, status } = play(card, p, [...calls, { type: 'finish' }]);
    expect(s.called).toBe(p.maxCalls);
    expect(status).toMatchObject({ done: true, solved: false, score: 'No line' });
  });
});

describe('4×4 Logic', () => {
  const p = payload<LogicGridPayload>('logic-grid');
  const n = p.cols.length;
  const tick = (answer: number[]) => answer.map((c, r) => ({ type: 'cycle', index: r * n + c }));

  it('has exactly one answer, and it is the stored one', () => {
    expect(solveLogicGrid(p)).toEqual([p.answer]);
  });

  it('can be won and lost', () => {
    expect(play(logicGrid, p, [...tick(p.answer), { type: 'check' }]).status).toMatchObject({ done: true, solved: true, score: '1 check' });
    const wrong = [p.answer[1], p.answer[0], p.answer[2], p.answer[3]];
    const tried = play(logicGrid, p, [...tick(wrong), { type: 'check' }]);
    expect(tried.status.done).toBe(false);
    expect(tried.s.note).toMatch(/2 of 4/);
    expect(play(logicGrid, p, [{ type: 'reveal' }]).status).toMatchObject({ done: true, solved: false });
  });
});
