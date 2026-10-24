/** Minesweeper rules and a no-guessing solver, free of UI. */

export interface HiddenCellsPayload {
  rows: number;
  cols: number;
  mines: number[];
  /** A safe square opened at the start, so the first move is never a guess. */
  start: number;
  intro: string;
}

export function neighbours(i: number, p: Pick<HiddenCellsPayload, 'rows' | 'cols'>): number[] {
  const r = Math.floor(i / p.cols);
  const c = i % p.cols;
  const out: number[] = [];
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const rr = r + dr;
      const cc = c + dc;
      if (rr >= 0 && rr < p.rows && cc >= 0 && cc < p.cols) out.push(rr * p.cols + cc);
    }
  return out;
}

export const countAround = (i: number, p: HiddenCellsPayload) => neighbours(i, p).filter((k) => p.mines.includes(k)).length;

/** Opens a square and floods outward from zeros. */
export function flood(open: number[], at: number, p: HiddenCellsPayload): number[] {
  const out = new Set(open);
  const stack = [at];
  while (stack.length) {
    const k = stack.pop()!;
    if (out.has(k) || p.mines.includes(k)) continue;
    out.add(k);
    if (countAround(k, p) === 0) neighbours(k, p).forEach((x) => !out.has(x) && stack.push(x));
  }
  return [...out];
}

/**
 * True when the board can be cleared from the start square by logic alone (no guessing),
 * using the two standard deductions: a number already touching all its mines frees the rest,
 * and a number with exactly as many hidden neighbours as mines left flags them all; plus
 * the subset rule between pairs of numbers.
 */
export function solvableWithoutGuessing(p: HiddenCellsPayload): boolean {
  const total = p.rows * p.cols;
  let open = flood([], p.start, p);
  const flags = new Set<number>();
  let progress = true;
  while (progress && open.length < total - p.mines.length) {
    progress = false;
    const openSet = new Set(open);
    const frontier = open.filter((i) => countAround(i, p) > 0);
    const info = frontier.map((i) => {
      const hidden = neighbours(i, p).filter((k) => !openSet.has(k) && !flags.has(k));
      const left = countAround(i, p) - neighbours(i, p).filter((k) => flags.has(k)).length;
      return { hidden, left };
    });
    for (const { hidden, left } of info) {
      if (!hidden.length) continue;
      if (left === 0) {
        for (const k of hidden) open = flood(open, k, p);
        progress = true;
      } else if (left === hidden.length) {
        hidden.forEach((k) => flags.add(k));
        progress = true;
      }
    }
    if (progress) continue;
    for (const a of info)
      for (const b of info) {
        if (a === b || !a.hidden.length || a.hidden.length >= b.hidden.length) continue;
        if (!a.hidden.every((k) => b.hidden.includes(k))) continue;
        const rest = b.hidden.filter((k) => !a.hidden.includes(k));
        if (b.left - a.left === 0) {
          for (const k of rest) open = flood(open, k, p);
          progress = true;
        } else if (b.left - a.left === rest.length) {
          rest.forEach((k) => flags.add(k));
          progress = true;
        }
      }
  }
  return open.length === total - p.mines.length;
}
