/** Number-grid solver used to prove a puzzle has exactly one solution (Sudoku family and Futoshiki). */

export interface Cage {
  cells: number[];
  sum: number;
}

export interface GridShape {
  size: number;
  /** 0 for grids without boxes (Futoshiki). */
  boxRows: number;
  boxCols: number;
  /** Killer Sudoku: each cage adds up to its sum with no repeats. */
  cages?: Cage[];
  /** Futoshiki: [a, b] means the number in cell a is smaller than the one in cell b. */
  less?: [number, number][];
}

/** Whether placing n at i breaks a rule, given the other values (0 = empty). */
export function breaksRule(v: number[], i: number, n: number, shape: GridShape): boolean {
  const { size, boxRows, boxCols, cages, less } = shape;
  const r = Math.floor(i / size);
  const c = i % size;
  for (let k = 0; k < size; k++) {
    if ((r * size + k !== i && v[r * size + k] === n) || (k * size + c !== i && v[k * size + c] === n)) return true;
  }
  if (boxRows) {
    const br = r - (r % boxRows);
    const bc = c - (c % boxCols);
    for (let y = 0; y < boxRows; y++)
      for (let x = 0; x < boxCols; x++) {
        const j = (br + y) * size + bc + x;
        if (j !== i && v[j] === n) return true;
      }
  }
  if (cages) {
    const cage = cages.find((cg) => cg.cells.includes(i));
    if (cage) {
      let total = n;
      let empty = 0;
      for (const j of cage.cells) {
        if (j === i) continue;
        if (v[j] === n) return true;
        if (v[j]) total += v[j];
        else empty++;
      }
      if (total > cage.sum || (empty === 0 && total !== cage.sum)) return true;
    }
  }
  if (less) {
    for (const [a, b] of less) {
      if (a === i && v[b] && !(n < v[b])) return true;
      if (b === i && v[a] && !(v[a] < n)) return true;
    }
  }
  return false;
}

/** Counts solutions up to `limit` (2 is enough to prove uniqueness). 0 means an empty cell. */
export function countSolutions(values: number[], shape: GridShape, limit = 2): number {
  const v = values.slice();
  for (let i = 0; i < v.length; i++) {
    if (v[i] && breaksRule(v, i, v[i], shape)) return 0;
  }
  let count = 0;
  const solve = (): void => {
    if (count >= limit) return;
    // Fill the empty cell with the fewest candidates first.
    let best = -1;
    let bestOptions: number[] = [];
    for (let i = 0; i < v.length; i++) {
      if (v[i]) continue;
      const options: number[] = [];
      for (let n = 1; n <= shape.size; n++) if (!breaksRule(v, i, n, shape)) options.push(n);
      if (!options.length) return;
      if (best < 0 || options.length < bestOptions.length) {
        best = i;
        bestOptions = options;
        if (options.length === 1) break;
      }
    }
    if (best < 0) {
      count++;
      return;
    }
    for (const n of bestOptions) {
      v[best] = n;
      solve();
      v[best] = 0;
      if (count >= limit) return;
    }
  };
  solve();
  return count;
}

/** One solution, or null; used by the generators. */
export function solveOne(values: number[], shape: GridShape, random: () => number = () => 0.5): number[] | null {
  const v = values.slice();
  const go = (): boolean => {
    const i = v.indexOf(0);
    if (i < 0) return true;
    const order = Array.from({ length: shape.size }, (_, k) => k + 1).sort(() => random() - 0.5);
    for (const n of order) {
      if (breaksRule(v, i, n, shape)) continue;
      v[i] = n;
      if (go()) return true;
      v[i] = 0;
    }
    return false;
  };
  return go() ? v : null;
}
