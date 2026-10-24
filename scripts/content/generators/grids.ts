import { flood, solvableWithoutGuessing, type HiddenCellsPayload } from '../../../src/engines/hidden-cells/logic';
import { solveLogicGrid, type Clue, type LogicGridPayload } from '../../../src/engines/logic-grid/logic';
import { countNonogramSolutions, type PictureLogicPayload } from '../../../src/engines/picture-logic/logic';
import { fewestMoves, solved, type TileSlidePayload } from '../../../src/engines/tile-slide/logic';
import type { Rng } from '../rng';
import { PICTURES } from './pictures';
import type { Draft, Level } from './types';

/** Minesweeper boards that can be cleared from the start square by logic alone. */
export function minesweeper(r: Rng, level: Level): Draft<HiddenCellsPayload> | null {
  const [rows, cols, mines] = { 1: [6, 6, 5], 2: [7, 7, 8], 3: [8, 8, 11] }[level];
  for (let attempt = 0; attempt < 3000; attempt++) {
    const p = { rows, cols, mines: r.shuffle(Array.from({ length: rows * cols }, (_, i) => i)).slice(0, mines).sort((a, b) => a - b), start: 0, intro: '' };
    const zeros = r.shuffle(Array.from({ length: rows * cols }, (_, i) => i).filter((i) => !p.mines.includes(i) && flood([], i, p).length > 1));
    for (const start of zeros) {
      const opened = flood([], start, p).length;
      // Open enough to start, but leave most of the board to solve.
      if (opened < 4 || opened > (rows * cols) / 3) continue;
      if (solvableWithoutGuessing({ ...p, start })) {
        return { formatId: 'minesweeper', level, payload: { ...p, start }, answers: [p.mines.join(',')] };
      }
    }
  }
  return null;
}

/** Sliding Tile: a random walk back from the solved board, with par measured exactly. */
export function slidingTile(r: Rng, level: Level): Draft<TileSlidePayload> | null {
  const size = 3;
  const [min, max] = { 1: [6, 10], 2: [12, 16], 3: [18, 24] }[level];
  for (let attempt = 0; attempt < 200; attempt++) {
    const b = solved(size);
    let prev = -1;
    // A walk of n moves can't need more than n to undo, so walk about as far as the target par.
    const steps = min + r.int(max - min + 3);
    for (let k = 0; k < steps; k++) {
      const z = b.indexOf(0);
      const moves = [z - size, z + size, z % size ? z - 1 : -1, (z + 1) % size ? z + 1 : -1].filter((t) => t >= 0 && t < b.length && t !== prev);
      const t = r.pick(moves);
      [b[z], b[t]] = [b[t], 0];
      prev = z;
    }
    const par = fewestMoves(b, size);
    if (par !== null && par >= min && par <= max) {
      return { formatId: 'sliding-tile', level, payload: { size, start: b, par, intro: '' }, answers: [b.join(',')] };
    }
  }
  return null;
}

/** Nonogram from the picture library; only pictures with exactly one solution are used. */
export function nonogram(r: Rng, level: Level): Draft<PictureLogicPayload> | null {
  const fit = PICTURES.filter((pic) => pic.level === level);
  for (const pic of r.shuffle(fit)) {
    const payload = { cols: pic.rows[0].length, solution: pic.rows.join(''), title: pic.title, intro: '' };
    if (countNonogramSolutions(payload) === 1) {
      return { formatId: 'nonogram', level, payload, answers: [pic.title], memory: pic.memory, needsReview: pic.reviewed ? undefined : 'Picture drawn for the library; check it reads as its title.' };
    }
  }
  return null;
}

const PEOPLE = ['Ada', 'Ben', 'Cy', 'Di', 'Eve', 'Fay', 'Gus', 'Hal', 'Ivy', 'Jo', 'Kit', 'Len', 'May', 'Ned', 'Pat', 'Ray', 'Sue', 'Tom'];
const SETS: { label: string; verb: string; article: boolean; items: string[] }[] = [
  { label: 'treat', verb: 'had', article: true, items: ['toast', 'scone', 'bun', 'tart', 'flapjack', 'crumpet'] },
  { label: 'drink', verb: 'had', article: true, items: ['tea', 'cocoa', 'squash', 'coffee', 'milk', 'lemonade'] },
  { label: 'hobby', verb: 'took up', article: false, items: ['knitting', 'chess', 'baking', 'gardening', 'stamp collecting', 'fishing'] },
  { label: 'seat', verb: 'sat in', article: true, items: ['armchair', 'rocking chair', 'window seat', 'deckchair', 'wing chair', 'high chair'] },
  { label: 'page of the paper', verb: 'read', article: true, items: ['crossword', 'letters page', 'recipes', 'horoscopes', 'sport', 'weather'] },
];

/** 4×4 Logic: clues written from templates and checked by the solver to leave exactly one answer. */
export function logicGrid(r: Rng, level: Level): Draft<LogicGridPayload> | null {
  for (let attempt = 0; attempt < 200; attempt++) {
    const set = r.pick(SETS);
    const rows = r.shuffle(PEOPLE).slice(0, 4).sort();
    const cols = r.shuffle(set.items).slice(0, 4);
    const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
    const answer = r.shuffle([0, 1, 2, 3]);
    const the = (c: number) => (set.article ? `the ${cols[c]}` : cols[c]);
    const v = set.verb;
    const not = v === 'had' ? 'didn’t have' : `didn’t ${v === 'took up' ? 'take up' : v === 'sat in' ? 'sit in' : v}`;
    const candidates: Clue[] = [];
    for (let row = 0; row < 4; row++) {
      const right = answer[row];
      const wrong = [0, 1, 2, 3].filter((c) => c !== right);
      candidates.push({ text: `${rows[row]} ${v} ${the(right)}.`, row, cols: [right] });
      for (const w of wrong) candidates.push({ text: `${rows[row]} ${not} ${the(w)}.`, row, cols: [w], negate: true });
      const [a, b] = r.shuffle(wrong);
      candidates.push({ text: `${rows[row]} ${v} neither ${the(a)} nor ${the(b)}.`, row, cols: [a, b], negate: true });
      const other = r.pick(wrong);
      const pair = r.shuffle([right, other]);
      candidates.push({ text: `${rows[row]} ${v} either ${the(pair[0])} or ${the(pair[1])}.`, row, cols: pair });
    }
    // Harder days avoid giving away a direct match.
    const pool = level === 3 ? candidates.filter((c) => c.negate || c.cols.length > 1) : candidates;
    const clues: Clue[] = [];
    for (const c of r.shuffle(pool)) {
      if (clues.length && solveLogicGrid({ rows, cols, clues, answer, intro: '' }).length === 1) break;
      if (clues.some((x) => x.row === c.row && x.text === c.text)) continue;
      clues.push(c);
    }
    const p = { rows, cols: cols.map(cap), clues, answer, intro: `Four friends each chose a different ${set.label}. Work out who chose which.` };
    if (clues.length > (level === 1 ? 4 : 6)) continue;
    if (solveLogicGrid(p).length !== 1) continue;
    // Drop clues that aren't needed.
    for (const c of clues.slice()) {
      const without = clues.filter((x) => x !== c);
      if (solveLogicGrid({ ...p, clues: without }).length === 1) clues.splice(clues.indexOf(c), 1);
    }
    return { formatId: 'logic-grid', level, payload: { ...p, clues }, answers: [rows.join() + cols.join() + answer.join()] };
  }
  return null;
}
