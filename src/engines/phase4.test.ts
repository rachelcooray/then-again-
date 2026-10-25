import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { FORMATS } from '../content/formats';
import { canvasPuzzle, PUZZLES } from '../content/canvas';
import { crossword } from './crossword';
import { entries, type CrosswordPayload } from './crossword/logic';
import { hiddenCells } from './hidden-cells';
import { solvableWithoutGuessing, type HiddenCellsPayload } from './hidden-cells/logic';
import { anagrams, type AnagramsPayload } from './letter-set/anagrams';
import { followsHiveRules, wordHive, type WordHivePayload } from './letter-set/word-hive';
import { numberGrid, type NumberGridPayload } from './number-grid';
import { countSolutions } from './number-grid/solver';
import { pictureLogic } from './picture-logic';
import { countNonogramSolutions, type PictureLogicPayload } from './picture-logic/logic';
import { higherLower, mysteryObject, putInOrder, quiz, type HigherLowerPayload, type MysteryPayload, type OrderPayload, type QuizPayload } from './quiz';
import { engineFor } from './registry';
import { sumGrid } from './sum-grid';
import { countKakuroSolutions, runsOf, type SumGridPayload } from './sum-grid/logic';
import { tileSlide } from './tile-slide';
import { fewestMoves, isSolvable, type TileSlidePayload } from './tile-slide/logic';
import type { AnyEngine, EngineContext } from './types';
import { wordChain } from './word-chain';
import { lettersChanged, shortestLadder, type WordChainPayload } from './word-chain/logic';

const dictionary: ReadonlySet<string> = new Set(
  readFileSync(join(__dirname, '../content/dictionary/words.txt'), 'utf8').split('\n').filter(Boolean),
);
const ctx: EngineContext = { dictionary };
const payload = <P>(formatId: string) => canvasPuzzle(formatId)!.payload as P;

function play<P>(engine: AnyEngine, p: P, actions: unknown[]) {
  let s = engine.init(p);
  for (const a of actions) s = engine.reduce(s, a, p, ctx);
  return { s, status: engine.status(s, p) };
}

describe('every format', () => {
  it('has an engine, a puzzle and help', () => {
    for (const f of FORMATS) {
      const engine = engineFor(f);
      expect(engine, f.id).toBeDefined();
      expect(engine!.help.length, f.id).toBeGreaterThan(20);
      expect(canvasPuzzle(f.id), f.id).toBeDefined();
    }
    expect(PUZZLES).toHaveLength(FORMATS.length);
  });
});

describe('number grids', () => {
  const fill = (p: NumberGridPayload) =>
    p.givens.split('').flatMap((g, i) => (g === '0' ? [{ type: 'select', index: i }, { type: 'put', value: Number(p.solution[i]) }] : []));

  for (const id of ['mini-sudoku', 'killer-sudoku', 'futoshiki']) {
    const p = payload<NumberGridPayload>(id);
    it(`${id} has exactly one solution, the stored one`, () => {
      const givens = p.givens.split('').map(Number);
      expect(countSolutions(givens, p)).toBe(1);
      expect(countSolutions(p.solution.split('').map(Number), p)).toBe(1);
    });
    it(`${id} can be won and lost`, () => {
      expect(play(numberGrid, p, fill(p)).status).toMatchObject({ done: true, solved: true });
      expect(play(numberGrid, p, [{ type: 'reveal' }]).status).toMatchObject({ done: true, solved: false });
    });
  }

  it('Killer Sudoku cages cover every square once and add up', () => {
    const p = payload<NumberGridPayload>('killer-sudoku');
    const cells = p.cages!.flatMap((c) => c.cells).sort((a, b) => a - b);
    expect(cells).toEqual(Array.from({ length: 16 }, (_, i) => i));
    for (const c of p.cages!) expect(c.cells.reduce((t, i) => t + Number(p.solution[i]), 0)).toBe(c.sum);
  });

  it('Futoshiki flags a number that breaks a sign', () => {
    const p = payload<NumberGridPayload>('futoshiki');
    // Cell 0 is 1 and must be smaller than cell 1, so 1 in cell 1 breaks a rule (and repeats in the row).
    const { s } = play(numberGrid, p, [{ type: 'select', index: 1 }, { type: 'put', value: 1 }, { type: 'check' }]);
    expect(s.wrong).toEqual([1]);
  });
});

describe('Kakuro', () => {
  const p = payload<SumGridPayload>('kakuro');
  it('has exactly one solution', () => {
    expect(countKakuroSolutions(p)).toBe(1);
    expect(runsOf(p).map((r) => r.sum).sort((a, b) => a - b)).toEqual([7, 10, 11, 12, 20, 24]);
  });
  it('can be won and lost', () => {
    const fills = p.solution.split('').flatMap((ch, i) => (ch === '#' ? [] : [{ type: 'select', index: i }, { type: 'put', value: Number(ch) }]));
    expect(play(sumGrid, p, fills).status).toMatchObject({ done: true, solved: true });
    expect(play(sumGrid, p, [{ type: 'reveal' }]).status).toMatchObject({ done: true, solved: false });
  });
});

describe('Nonogram', () => {
  const p = payload<PictureLogicPayload>('nonogram');
  it('has exactly one picture', () => {
    expect(countNonogramSolutions(p)).toBe(1);
  });
  it('can tell a picture with two solutions', () => {
    expect(countNonogramSolutions({ ...p, cols: 2, solution: '1001' })).toBe(2);
  });
  it('can be won (marks don’t matter) and lost', () => {
    const taps = p.solution.split('').flatMap((b, i) => (b === '1' ? [{ type: 'tap', index: i }] : []));
    const marks = [{ type: 'mode', mode: 'mark' }, { type: 'tap', index: p.solution.indexOf('0') }, { type: 'mode', mode: 'fill' }];
    expect(play(pictureLogic, p, [...marks, ...taps]).status).toMatchObject({ done: true, solved: true });
    expect(play(pictureLogic, p, [{ type: 'reveal' }]).status).toMatchObject({ done: true, solved: false });
  });
});

describe('Minesweeper', () => {
  const p = payload<HiddenCellsPayload>('minesweeper');
  const safe = Array.from({ length: p.rows * p.cols }, (_, i) => i).filter((i) => !p.mines.includes(i));
  it('can be cleared from the start square without guessing', () => {
    expect(p.mines).not.toContain(p.start);
    expect(solvableWithoutGuessing(p)).toBe(true);
  });
  it('can be won, flags protect squares, and a mine loses', () => {
    expect(play(hiddenCells, p, safe.map((index) => ({ type: 'tap', index }))).status).toMatchObject({ done: true, solved: true });
    const flagged = play(hiddenCells, p, [{ type: 'mode', mode: 'flag' }, { type: 'tap', index: p.mines[0] }, { type: 'mode', mode: 'dig' }, { type: 'tap', index: p.mines[0] }]);
    expect(flagged.status.done).toBe(false);
    expect(play(hiddenCells, p, [{ type: 'tap', index: p.mines[0] }]).status).toMatchObject({ done: true, solved: false });
  });
});

describe('Sliding Tile', () => {
  const p = payload<TileSlidePayload>('sliding-tile');
  it('starts from a solvable position with the right par', () => {
    expect(isSolvable(p.start, p.size)).toBe(true);
    expect(isSolvable([2, 1, 3, 4, 5, 6, 7, 8, 0], 3)).toBe(false);
    expect(fewestMoves(p.start, p.size)).toBe(p.par);
  });
  it('only slides tiles next to the gap; can be won and lost', () => {
    expect(play(tileSlide, p, [{ type: 'slide', tile: 1 }]).s.moves).toBe(0);
    // 1 2 3 / 4 8 5 / 7 6 _ comes home by sliding 6, 8, 5, 6.
    const route = [6, 8, 5, 6].map((tile) => ({ type: 'slide', tile }));
    const won = play(tileSlide, p, route);
    expect(won.status).toMatchObject({ done: true, solved: true });
    expect(play(tileSlide, p, [{ type: 'reveal' }]).status).toMatchObject({ done: true, solved: false });
  });
});

describe('Mini Crossword', () => {
  const p = payload<CrosswordPayload>('mini-crossword');
  it('numbers the grid and has a clue for every entry', () => {
    const { entries: all } = entries(p);
    expect(all).toHaveLength(8);
    for (const e of all) {
      expect(e.clue, `${e.num} ${e.dir}`).not.toBe('');
      expect(dictionary.has(e.answer) || e.answer.length < 4, e.answer).toBe(true);
    }
  });
  it('can be won by typing across each row, and lost', () => {
    const typing = p.solution.split('').map((letter) => ({ type: 'letter', letter }));
    // The cursor starts on the first square, going across; tapping it again would switch to down.
    const rows = [0, 4, 8, 12].flatMap((start, r) => [...(r ? [{ type: 'select', index: start }] : []), ...typing.slice(r * 4, r * 4 + 4)]);
    expect(play(crossword, p, rows).status).toMatchObject({ done: true, solved: true });
    expect(play(crossword, p, [{ type: 'reveal' }]).status).toMatchObject({ done: true, solved: false });
  });
});

describe('Word Ladder', () => {
  const p = payload<WordChainPayload>('word-ladder');
  const step = (w: string) => [{ type: 'type', value: w }, { type: 'submit' }];
  it('has a real route of par length through the dictionary', () => {
    expect(p.route[0]).toBe(p.start);
    expect(p.route[p.route.length - 1]).toBe(p.end);
    expect(p.route.length - 1).toBe(p.par);
    p.route.forEach((w, i) => {
      expect(dictionary.has(w), w).toBe(true);
      if (i) expect(lettersChanged(p.route[i - 1], w)).toBe(1);
    });
    expect(shortestLadder(p.start, p.end, dictionary)!.length - 1).toBe(p.par);
  });
  it('enforces one letter at a time with real words; can be won and lost', () => {
    expect(play(wordChain, p, step('WARM')).s.note).toMatch(/exactly one letter/);
    expect(play(wordChain, p, step('COZD')).s.note).toMatch(/isn’t in our word list/);
    expect(play(wordChain, p, p.route.slice(1).flatMap(step)).status).toMatchObject({ done: true, solved: true });
    expect(play(wordChain, p, [{ type: 'reveal' }]).status).toMatchObject({ done: true, solved: false });
  });
});

describe('Anagrams', () => {
  const p = payload<AnagramsPayload>('anagrams');
  const spell = (w: string) => [...w.split('').map((letter) => ({ type: 'typed', letter })), { type: 'submit' }];
  it('uses real words whose letters match', () => {
    for (const r of p.rounds) {
      expect(dictionary.has(r.answer), r.answer).toBe(true);
      expect([...r.letters].sort().join('')).toBe([...r.answer].sort().join(''));
    }
  });
  it('can be won and lost', () => {
    expect(play(anagrams, p, p.rounds.flatMap((r) => spell(r.answer))).status).toMatchObject({ done: true, solved: true, score: '5/5' });
    const skips = p.rounds.map(() => ({ type: 'skip' }));
    expect(play(anagrams, p, skips).status).toMatchObject({ done: true, solved: false, score: '0/5' });
  });
});

describe('Word Hive', () => {
  const p = payload<WordHivePayload>('word-hive');
  const spell = (w: string) => [...w.split('').map((letter) => ({ type: 'letter', letter })), { type: 'enter' }];
  it('only lists real words that follow the hive rules, and a true pangram', () => {
    for (const w of p.words) {
      expect(followsHiveRules(w, p), w).toBeNull();
      expect(dictionary.has(w), w).toBe(true);
    }
    for (const w of p.pangrams) expect(new Set(w).size).toBe(7);
  });
  it('refuses words without the centre letter, and can be won and lost', () => {
    expect(play(wordHive, p, spell('PEST')).s.note).toMatch(/centre/);
    const goal = p.words.slice(0, p.goal).flatMap(spell);
    expect(play(wordHive, p, [...goal, { type: 'finish' }]).status).toMatchObject({ done: true, solved: true });
    expect(play(wordHive, p, [...spell('CAPE'), { type: 'finish' }]).status).toMatchObject({ done: true, solved: false });
  });
});

describe('quiz family', () => {
  it('The Quiz can be won and lost', () => {
    const p = payload<QuizPayload>('quiz');
    const answer = (k: (i: number) => number) => p.questions.flatMap((_, i) => [{ type: 'pick', option: k(i) }, { type: 'next' }]);
    expect(play(quiz, p, answer((i) => p.questions[i].answer)).status).toMatchObject({ done: true, solved: true, score: '5/5' });
    expect(play(quiz, p, answer((i) => (p.questions[i].answer + 1) % 4)).status).toMatchObject({ done: true, solved: false, score: '0/5' });
  });

  it('Higher or Lower can be won and lost; no two neighbours are equal', () => {
    const p = payload<HigherLowerPayload>('higher-lower');
    p.items.slice(1).forEach((it, i) => expect(it.value).not.toBe(p.items[i].value));
    const guesses = (right: boolean) => p.items.slice(1).flatMap((it, i) => [{ type: 'guess', higher: (it.value > p.items[i].value) === right }, { type: 'next' }]);
    expect(play(higherLower, p, guesses(true)).status).toMatchObject({ done: true, solved: true, score: '6/6' });
    expect(play(higherLower, p, guesses(false)).status).toMatchObject({ done: true, solved: false, score: '0/6' });
  });

  it('Mystery Object can be won and lost', () => {
    const p = payload<MysteryPayload>('mystery-object');
    expect(p.options).toContain(p.answer);
    expect(play(mysteryObject, p, [{ type: 'guess', option: p.answer }]).status).toMatchObject({ done: true, solved: true, score: '5 points' });
    const wrong = p.options.filter((o) => o !== p.answer).map((option) => ({ type: 'guess', option }));
    expect(play(mysteryObject, p, wrong).status).toMatchObject({ done: true, solved: false });
  });

  it('Put It in Order can be won and lost', () => {
    const p = payload<OrderPayload>('put-in-order');
    // Bubble the starting order into place with moves, then check.
    const order = p.start.slice();
    const moves: unknown[] = [];
    for (let a = 0; a < order.length; a++)
      for (let k = 0; k < order.length - 1 - a; k++)
        if (order[k] > order[k + 1]) {
          [order[k], order[k + 1]] = [order[k + 1], order[k]];
          moves.push({ type: 'move', from: k, by: 1 });
        }
    expect(play(putInOrder, p, [...moves, { type: 'check' }]).status).toMatchObject({ done: true, solved: true, score: '1 check' });
    expect(play(putInOrder, p, Array.from({ length: p.checks }, () => ({ type: 'check' }))).status).toMatchObject({ done: true, solved: false });
  });
});
