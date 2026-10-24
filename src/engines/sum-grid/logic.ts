/** Kakuro rules and solver, free of UI. */

export interface SumGridPayload {
  cols: number;
  /** Row by row: '#' for a black square, otherwise the solution digit. */
  solution: string;
  intro: string;
}

export interface Run {
  dir: 'across' | 'down';
  /** The black square that carries the clue. */
  clue: number;
  cells: number[];
  sum: number;
}

/** The runs of white squares and their sums, read off the solution. */
export function runsOf(p: SumGridPayload): Run[] {
  const { cols, solution } = p;
  const rows = solution.length / cols;
  const white = (r: number, c: number) => r >= 0 && c >= 0 && r < rows && c < cols && solution[r * cols + c] !== '#';
  const runs: Run[] = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      if (white(r, c)) continue;
      for (const dir of ['across', 'down'] as const) {
        const cells: number[] = [];
        let [rr, cc] = dir === 'across' ? [r, c + 1] : [r + 1, c];
        while (white(rr, cc)) {
          cells.push(rr * cols + cc);
          if (dir === 'across') cc++;
          else rr++;
        }
        if (cells.length) runs.push({ dir, clue: r * cols + c, cells, sum: cells.reduce((t, i) => t + Number(solution[i]), 0) });
      }
    }
  return runs;
}

/** Counts digit fillings that satisfy every run, up to `limit`. */
export function countKakuroSolutions(p: SumGridPayload, limit = 2): number {
  const runs = runsOf(p);
  const whites = p.solution.split('').map((ch, i) => (ch === '#' ? -1 : i)).filter((i) => i >= 0);
  const v = Array(p.solution.length).fill(0);
  const runsAt = new Map<number, Run[]>();
  for (const r of runs) for (const i of r.cells) runsAt.set(i, [...(runsAt.get(i) ?? []), r]);
  const fits = (i: number, n: number) =>
    (runsAt.get(i) ?? []).every((r) => {
      let total = n;
      let empty = 0;
      for (const j of r.cells) {
        if (j === i) continue;
        if (v[j] === n) return false;
        if (v[j]) total += v[j];
        else empty++;
      }
      return empty === 0 ? total === r.sum : total + empty <= r.sum && total < r.sum;
    });
  let count = 0;
  const go = (k: number) => {
    if (count >= limit) return;
    if (k === whites.length) {
      count++;
      return;
    }
    const i = whites[k];
    for (let n = 1; n <= 9; n++) {
      if (!fits(i, n)) continue;
      v[i] = n;
      go(k + 1);
      v[i] = 0;
    }
  };
  go(0);
  return count;
}
