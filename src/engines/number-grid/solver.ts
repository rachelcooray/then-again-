/** Latin-square-with-boxes solver used to prove a puzzle has exactly one solution. */

export interface GridShape {
  size: number;
  boxRows: number;
  boxCols: number;
}

/** Counts solutions up to `limit` (2 is enough to prove uniqueness). 0 means empty cell. */
export function countSolutions(values: number[], shape: GridShape, limit = 2): number {
  const { size, boxRows, boxCols } = shape;
  const v = values.slice();
  const ok = (i: number, n: number) => {
    const r = Math.floor(i / size);
    const c = i % size;
    for (let k = 0; k < size; k++) {
      if (v[r * size + k] === n || v[k * size + c] === n) return false;
    }
    const br = r - (r % boxRows);
    const bc = c - (c % boxCols);
    for (let y = 0; y < boxRows; y++) for (let x = 0; x < boxCols; x++) if (v[(br + y) * size + bc + x] === n) return false;
    return true;
  };
  let count = 0;
  const solve = (): void => {
    if (count >= limit) return;
    // Fill the empty cell with the fewest candidates first.
    let best = -1;
    let bestOptions: number[] = [];
    for (let i = 0; i < v.length; i++) {
      if (v[i]) continue;
      const options: number[] = [];
      for (let n = 1; n <= size; n++) if (ok(i, n)) options.push(n);
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
  // A given that already breaks the rules has no solutions.
  for (let i = 0; i < v.length; i++) {
    if (!v[i]) continue;
    const n = v[i];
    v[i] = 0;
    const fine = ok(i, n);
    v[i] = n;
    if (!fine) return 0;
  }
  solve();
  return count;
}

/** True when a full grid follows every row, column and box rule. */
export function isValidSolution(values: number[], shape: GridShape): boolean {
  return values.every((n) => n >= 1 && n <= shape.size) && countSolutions(values, shape) === 1;
}
