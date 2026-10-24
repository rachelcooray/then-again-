/** Word Ladder rules and shortest-route solver, free of UI. */

export interface WordChainPayload {
  start: string;
  end: string;
  /** Fewest steps from start to end. */
  par: number;
  /** One shortest route, shown when the player gives up. */
  route: string[];
  intro: string;
}

export const lettersChanged = (a: string, b: string) => a.split('').filter((ch, i) => ch !== b[i]).length;

/** Shortest ladder between two words through the dictionary, or null. */
export function shortestLadder(start: string, end: string, dictionary: ReadonlySet<string>): string[] | null {
  const words = [...dictionary].filter((w) => w.length === start.length);
  const prev = new Map<string, string | null>([[start, null]]);
  let layer = [start];
  while (layer.length) {
    const next: string[] = [];
    for (const w of layer) {
      if (w === end) {
        const path = [w];
        let p = prev.get(w);
        while (p) {
          path.unshift(p);
          p = prev.get(p);
        }
        return path;
      }
      for (const x of words) {
        if (!prev.has(x) && lettersChanged(w, x) === 1) {
          prev.set(x, w);
          next.push(x);
        }
      }
    }
    layer = next;
  }
  return null;
}
