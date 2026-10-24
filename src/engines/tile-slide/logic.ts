/** Sliding tile rules, free of UI. */

export interface TileSlidePayload {
  size: number;
  /** Row by row, 0 for the gap. */
  start: number[];
  /** Fewest moves to solve, if known. */
  par?: number;
  intro: string;
}

export const solved = (size: number) => [...Array.from({ length: size * size - 1 }, (_, i) => i + 1), 0];

/** Only half of all arrangements can be slid back into order; this tells which. */
export function isSolvable(board: number[], size: number): boolean {
  const tiles = board.filter(Boolean);
  let inversions = 0;
  for (let i = 0; i < tiles.length; i++) for (let j = i + 1; j < tiles.length; j++) if (tiles[i] > tiles[j]) inversions++;
  if (size % 2 === 1) return inversions % 2 === 0;
  const gapRowFromBottom = size - Math.floor(board.indexOf(0) / size);
  return (inversions + gapRowFromBottom) % 2 === 1;
}

/** Fewest moves to solve (breadth-first search; fine for 3×3). */
export function fewestMoves(start: number[], size: number, cap = 200_000): number | null {
  const goal = solved(size).join();
  const seen = new Set([start.join()]);
  let layer = [start];
  for (let depth = 0; layer.length && seen.size < cap; depth++) {
    const next: number[][] = [];
    for (const b of layer) {
      if (b.join() === goal) return depth;
      const z = b.indexOf(0);
      for (const d of [-size, size, -1, 1]) {
        const t = z + d;
        if (t < 0 || t >= b.length || (Math.abs(d) === 1 && Math.floor(t / size) !== Math.floor(z / size))) continue;
        const nb = b.slice();
        nb[z] = nb[t];
        nb[t] = 0;
        const key = nb.join();
        if (!seen.has(key)) {
          seen.add(key);
          next.push(nb);
        }
      }
    }
    layer = next;
  }
  return null;
}
