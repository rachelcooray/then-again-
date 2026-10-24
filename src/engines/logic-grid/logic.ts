/** 4×4 Logic rules and solver, free of UI. */

/** A clue as text plus the rule a solver checks: row `row` matches one of `cols` (or none of them). */
export interface Clue {
  text: string;
  row: number;
  cols: number[];
  negate?: boolean;
}

export interface LogicGridPayload {
  rows: string[];
  cols: string[];
  clues: Clue[];
  /** answer[row] = column. */
  answer: number[];
  intro: string;
}

function permutations(n: number): number[][] {
  if (n === 0) return [[]];
  return permutations(n - 1).flatMap((p) => Array.from({ length: n }, (_, i) => [...p.slice(0, i), n - 1, ...p.slice(i)]));
}

/** Every one-to-one matching that satisfies all clues. Exactly one means the puzzle is fair. */
export function solveLogicGrid(p: LogicGridPayload): number[][] {
  return permutations(p.rows.length).filter((perm) =>
    p.clues.every((c) => c.cols.includes(perm[c.row]) !== !!c.negate),
  );
}
