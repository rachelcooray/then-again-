/** Daily Bingo rules, kept free of UI so tests and content checks can use them. */

export const FREE = 'FREE';

export interface CardPayload {
  /** 25 squares, row by row; the centre is FREE. */
  card: string[];
  calls: string[];
  /** A line must be completed within this many calls. */
  maxCalls: number;
  intro: string;
}

export interface CardState {
  called: number;
  marked: number[];
  ended: boolean;
  note: string;
}

export type CardAction = { type: 'call' } | { type: 'mark'; index: number } | { type: 'finish' };

export const SIDE = 5;

export const LINES: number[][] = (() => {
  const lines: number[][] = [];
  for (let i = 0; i < SIDE; i++) {
    lines.push(Array.from({ length: SIDE }, (_, k) => i * SIDE + k));
    lines.push(Array.from({ length: SIDE }, (_, k) => k * SIDE + i));
  }
  lines.push([0, 6, 12, 18, 24], [4, 8, 12, 16, 20]);
  return lines;
})();

export const winningLine = (marked: number[]) => LINES.find((ln) => ln.every((i) => marked.includes(i)));

/** Fewest calls after which a line is possible, for checking a card against maxCalls. */
export function earliestLine(p: CardPayload): number {
  for (let n = 1; n <= p.calls.length; n++) {
    const called = new Set(p.calls.slice(0, n));
    const marked = p.card.map((t, i) => (t === FREE || called.has(t) ? i : -1)).filter((i) => i >= 0);
    if (winningLine(marked)) return n;
  }
  return Infinity;
}
