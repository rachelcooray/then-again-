/** Nonogram rules and solver, free of UI. */

export interface PictureLogicPayload {
  cols: number;
  /** Row by row, '1' filled and '0' empty. */
  solution: string;
  /** What the finished picture shows, revealed at the end. */
  title: string;
  intro: string;
}

export function runs(line: number[]): number[] {
  const out: number[] = [];
  let n = 0;
  for (const x of line) {
    if (x === 1) n++;
    else if (n) {
      out.push(n);
      n = 0;
    }
  }
  if (n) out.push(n);
  return out;
}

export function clues(p: PictureLogicPayload) {
  const bits = p.solution.split('').map(Number);
  const rows = bits.length / p.cols;
  const row = (r: number) => bits.slice(r * p.cols, (r + 1) * p.cols);
  const col = (c: number) => Array.from({ length: rows }, (_, r) => bits[r * p.cols + c]);
  return {
    rows: Array.from({ length: rows }, (_, r) => runs(row(r))),
    cols: Array.from({ length: p.cols }, (_, c) => runs(col(c))),
  };
}

/** Every way to lay out the runs in a line of the given length. */
function linePatterns(clue: number[], len: number): number[][] {
  if (!clue.length) return [Array(len).fill(0)];
  const [first, ...rest] = clue;
  const restMin = rest.reduce((t, n) => t + n + 1, 0);
  const out: number[][] = [];
  for (let start = 0; start + first + restMin <= len; start++) {
    const head = [...Array(start).fill(0), ...Array(first).fill(1)];
    if (!rest.length) out.push([...head, ...Array(len - head.length).fill(0)]);
    else for (const tail of linePatterns(rest, len - head.length - 1)) out.push([...head, 0, ...tail]);
  }
  return out;
}

/** Counts pictures that match every row and column clue, up to `limit`. */
export function countNonogramSolutions(p: PictureLogicPayload, limit = 2): number {
  const c = clues(p);
  const nRows = c.rows.length;
  const nCols = p.cols;
  const options = c.rows.map((cl) => linePatterns(cl, nCols));
  const grid: number[][] = [];
  // A column can still match if its finished runs agree with its clue so far.
  const colPrefixOk = (col: number, rowsSoFar: number) => {
    const line = grid.slice(0, rowsSoFar).map((row) => row[col]);
    const got = runs(line);
    const want = c.cols[col];
    if (rowsSoFar === nRows) return got.join() === want.join();
    if (got.length > want.length) return false;
    const open = line[line.length - 1] === 1;
    return got.every((n, k) => (k === got.length - 1 && open ? n <= want[k] : n === want[k]));
  };
  let count = 0;
  const go = (r: number) => {
    if (count >= limit) return;
    if (r === nRows) {
      count++;
      return;
    }
    for (const pattern of options[r]) {
      grid[r] = pattern;
      let ok = true;
      for (let col = 0; col < nCols && ok; col++) ok = colPrefixOk(col, r + 1);
      if (ok) go(r + 1);
      if (count >= limit) return;
    }
    grid.length = r;
  };
  go(0);
  return count;
}
