/** Word Search rules, free of UI. */

export interface PlacedWord {
  word: string;
  /** Cell index of the first letter. */
  start: number;
  /** Cell index of the last letter. */
  end: number;
}

export interface WordSearchPayload {
  cols: number;
  /** Grid letters, row by row. */
  letters: string;
  words: PlacedWord[];
  intro: string;
}

/** Cells a placed word covers; null if the start and end aren't on one straight line. */
export function wordPath(w: PlacedWord, cols: number): number[] | null {
  const n = w.word.length;
  const [r0, c0, r1, c1] = [Math.floor(w.start / cols), w.start % cols, Math.floor(w.end / cols), w.end % cols];
  const dr = (r1 - r0) / (n - 1);
  const dc = (c1 - c0) / (n - 1);
  if (![dr, dc].every((d) => d === -1 || d === 0 || d === 1) || (dr === 0 && dc === 0)) return null;
  return Array.from({ length: n }, (_, k) => (r0 + dr * k) * cols + c0 + dc * k);
}
