/** Crossword numbering and entries, free of UI. */

export interface CrosswordPayload {
  cols: number;
  /** Row by row: '#' for a black square, otherwise the answer letter. */
  solution: string;
  /** Clues by number. */
  across: Record<number, string>;
  down: Record<number, string>;
  intro: string;
}

export interface Entry {
  num: number;
  dir: 'across' | 'down';
  cells: number[];
  answer: string;
  clue: string;
}

/** Standard numbering: a square gets a number if an across or down entry of 2+ letters starts there. */
export function entries(p: CrosswordPayload): { entries: Entry[]; numbers: Record<number, number> } {
  const { cols, solution } = p;
  const rows = solution.length / cols;
  const white = (r: number, c: number) => r >= 0 && c >= 0 && r < rows && c < cols && solution[r * cols + c] !== '#';
  const out: Entry[] = [];
  const numbers: Record<number, number> = {};
  let n = 0;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      if (!white(r, c)) continue;
      const startsAcross = !white(r, c - 1) && white(r, c + 1);
      const startsDown = !white(r - 1, c) && white(r + 1, c);
      if (!startsAcross && !startsDown) continue;
      n++;
      numbers[r * cols + c] = n;
      for (const dir of ['across', 'down'] as const) {
        if (dir === 'across' ? !startsAcross : !startsDown) continue;
        const cells: number[] = [];
        let [rr, cc] = [r, c];
        while (white(rr, cc)) {
          cells.push(rr * cols + cc);
          if (dir === 'across') cc++;
          else rr++;
        }
        out.push({ num: n, dir, cells, answer: cells.map((i) => solution[i]).join(''), clue: (dir === 'across' ? p.across : p.down)[n] ?? '' });
      }
    }
  return { entries: out, numbers };
}
