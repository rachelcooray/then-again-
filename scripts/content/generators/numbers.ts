import type { NumberGridPayload } from '../../../src/engines/number-grid';
import { countSolutions, solveOne, type Cage, type GridShape } from '../../../src/engines/number-grid/solver';
import { countKakuroSolutions, runsOf, type SumGridPayload } from '../../../src/engines/sum-grid/logic';
import type { Rng } from '../rng';
import type { Draft, Level } from './types';

const join = (v: number[]) => v.join('');

/** A random full grid that follows the shape's rules. */
function fullGrid(shape: GridShape, r: Rng): number[] {
  return solveOne(Array(shape.size * shape.size).fill(0), shape, r.next)!;
}

/** Removes givens one at a time, in random order, while the puzzle keeps exactly one solution. */
function carve(solution: number[], shape: GridShape, r: Rng, keepAtLeast: number): number[] {
  const g = solution.slice();
  for (const i of r.shuffle(g.map((_, k) => k))) {
    if (g.filter(Boolean).length <= keepAtLeast) break;
    const was = g[i];
    g[i] = 0;
    if (countSolutions(g, shape) !== 1) g[i] = was;
  }
  return g;
}

/** Sudoku 9×9. Fewer starting numbers make it harder. */
export function sudoku(r: Rng, level: Level): Draft<NumberGridPayload> {
  const shape = { size: 9, boxRows: 3, boxCols: 3 };
  const sol = fullGrid(shape, r);
  const keep = { 1: 38, 2: 31, 3: 26 }[level];
  const givens = carve(sol, shape, r, keep);
  return { formatId: 'sudoku', level, payload: { ...shape, givens: join(givens), solution: join(sol) }, answers: [join(sol)] };
}

/** Mini Sudoku: 4×4 for easy and medium, 6×6 (2×3 boxes) for hard. */
export function miniSudoku(r: Rng, level: Level): Draft<NumberGridPayload> {
  const shape = level === 3 ? { size: 6, boxRows: 2, boxCols: 3 } : { size: 4, boxRows: 2, boxCols: 2 };
  const sol = fullGrid(shape, r);
  const keep = { 1: 8, 2: 6, 3: 14 }[level];
  const givens = carve(sol, shape, r, keep);
  return { formatId: 'mini-sudoku', level, payload: { ...shape, givens: join(givens), solution: join(sol) }, answers: [join(sol)] };
}

/** Splits the grid into cages of 1 to `maxSize` touching squares. */
function randomCages(sol: number[], size: number, r: Rng, maxSize: number): Cage[] {
  const owner = Array(sol.length).fill(-1);
  const cages: Cage[] = [];
  for (const start of r.shuffle(sol.map((_, i) => i))) {
    if (owner[start] >= 0) continue;
    const cells = [start];
    owner[start] = cages.length;
    const target = 1 + r.int(maxSize);
    while (cells.length < target) {
      const options = cells.flatMap((c) =>
        [c - size, c + size, c % size ? c - 1 : -1, (c + 1) % size ? c + 1 : -1].filter(
          (n) => n >= 0 && n < sol.length && owner[n] < 0 && !cells.some((x) => sol[x] === sol[n]),
        ),
      );
      if (!options.length) break;
      const n = r.pick(options);
      owner[n] = cages.length;
      cells.push(n);
    }
    cages.push({ cells: cells.sort((a, b) => a - b), sum: cells.reduce((t, i) => t + sol[i], 0) });
  }
  return cages;
}

/** Killer Sudoku with no starting numbers: 4×4 for easy, 6×6 above. */
export function killerSudoku(r: Rng, level: Level): Draft<NumberGridPayload> | null {
  const base = level === 1 ? { size: 4, boxRows: 2, boxCols: 2 } : { size: 6, boxRows: 2, boxCols: 3 };
  for (let attempt = 0; attempt < 60; attempt++) {
    const sol = fullGrid(base, r);
    const cages = randomCages(sol, base.size, r, level === 3 ? 4 : 3);
    const shape = { ...base, cages };
    if (countSolutions(Array(sol.length).fill(0), shape) === 1) {
      return { formatId: 'killer-sudoku', level, payload: { ...shape, givens: '0'.repeat(sol.length), solution: join(sol) }, answers: [join(sol)] };
    }
  }
  return null;
}

/** Futoshiki: a Latin square with signs; 4×4 easy, 5×5 above. Adds signs until unique, then trims extras. */
export function futoshiki(r: Rng, level: Level): Draft<NumberGridPayload> | null {
  for (let attempt = 0; attempt < 40; attempt++) {
    const d = futoshikiOnce(r, level);
    if (d) return d;
  }
  return null;
}

function futoshikiOnce(r: Rng, level: Level): Draft<NumberGridPayload> | null {
  const size = level === 1 ? 4 : 5;
  const base = { size, boxRows: 0, boxCols: 0 };
  const sol = fullGrid(base, r);
  const pairs: [number, number][] = [];
  for (let i = 0; i < sol.length; i++) {
    if ((i + 1) % size) pairs.push([i, i + 1]);
    if (i + size < sol.length) pairs.push([i, i + size]);
  }
  const less: [number, number][] = [];
  const givens = Array(sol.length).fill(0);
  if (level < 3) givens[r.int(sol.length)] = 1; // one starting number on easier days
  for (const i of givens.keys()) if (givens[i]) givens[i] = sol[i];
  for (const [a, b] of r.shuffle(pairs)) {
    if (countSolutions(givens, { ...base, less }) === 1) break;
    less.push(sol[a] < sol[b] ? [a, b] : [b, a]);
  }
  if (countSolutions(givens, { ...base, less }) !== 1) return null;
  for (const sign of r.shuffle(less.slice())) {
    const without = less.filter((x) => x !== sign);
    if (countSolutions(givens, { ...base, less: without }) === 1) less.splice(less.indexOf(sign), 1);
  }
  return { formatId: 'futoshiki', level, payload: { ...base, less, givens: join(givens), solution: join(sol) }, answers: [join(sol)] };
}

/** Kakuro layouts: '#' black, '.' white. The top row and left column carry the clues. */
const KAKURO_LAYOUTS: Record<Level, string[][]> = {
  1: [['####', '#...', '#...', '#...']],
  2: [['#####', '##..#', '#....', '#....', '#..##'], ['#####', '#..##', '#...#', '#....', '##...']],
  3: [['######', '#..#..', '#.....', '##...#', '#.....', '#..#..'], ['######', '#...##', '#....#', '#.....', '##....', '###...']],
};

export function kakuro(r: Rng, level: Level): Draft<SumGridPayload> | null {
  const layout = r.pick(KAKURO_LAYOUTS[level]);
  const cols = layout[0].length;
  const cells = layout.join('');
  // Random fillings rarely have one answer, so this takes many cheap tries.
  for (let attempt = 0; attempt < 20000; attempt++) {
    const digits = cells.split('').map(() => 0);
    const probe = { cols, solution: cells.replace(/\./g, '1'), intro: '' };
    const runs = runsOf(probe);
    let ok = true;
    for (let i = 0; i < cells.length && ok; i++) {
      if (cells[i] === '#') continue;
      const mine = runs.filter((run) => run.cells.includes(i));
      // Low and high digits make sums with fewer possible splits, which keeps the answer unique.
      const options = [1, 2, 3, 4, 5, 6, 7, 8, 9]
        .map((n) => ({ n, key: r.next() / (Math.abs(n - 5) + 1) }))
        .sort((a, b) => a.key - b.key)
        .map((o) => o.n)
        .filter((n) => mine.every((run) => run.cells.every((j) => digits[j] !== n)));
      if (!options.length) ok = false;
      else digits[i] = options[0];
    }
    if (!ok) continue;
    const solution = cells.split('').map((ch, i) => (ch === '#' ? '#' : String(digits[i]))).join('');
    const p: SumGridPayload = { cols, solution, intro: '' };
    if (countKakuroSolutions(p) === 1) return { formatId: 'kakuro', level, payload: p, answers: [solution] };
  }
  return null;
}
