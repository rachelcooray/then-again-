import type { Engine, EngineViewProps } from '../types';
import { useRovingGrid } from '../useRovingGrid';
import '../engines.css';

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

/** 0 = blank, 1 = yes (✓), 2 = no (×). */
export type Mark = 0 | 1 | 2;

export interface LogicGridState {
  marks: Mark[];
  checks: number;
  hintsUsed: number;
  solved: boolean;
  revealed: boolean;
  note: string;
}

export type LogicGridAction = { type: 'cycle'; index: number } | { type: 'check' } | { type: 'hint' } | { type: 'reveal' };

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

const FREE_HINTS = 1;

function reduce(s: LogicGridState, a: LogicGridAction, p: LogicGridPayload): LogicGridState {
  if (s.solved || s.revealed) return s;
  const n = p.cols.length;
  switch (a.type) {
    case 'cycle': {
      const marks = s.marks.slice();
      marks[a.index] = ((marks[a.index] + 1) % 3) as Mark;
      return { ...s, marks, note: '' };
    }
    case 'check': {
      const picks = p.rows.map((_, r) => p.cols.map((_, c) => c).filter((c) => s.marks[r * n + c] === 1));
      if (picks.some((x) => x.length !== 1)) return { ...s, note: 'Give each row exactly one ✓, then check.' };
      const right = picks.filter((x, r) => x[0] === p.answer[r]).length;
      const checks = s.checks + 1;
      if (right === p.rows.length) return { ...s, checks, solved: true, note: 'Solved! Every match is right.' };
      return { ...s, checks, note: `${right} of ${p.rows.length} are right. Read the clues again.` };
    }
    case 'hint': {
      if (s.hintsUsed >= FREE_HINTS) return { ...s, note: 'You’ve used today’s free hint.' };
      const r = p.rows.findIndex((_, row) => s.marks[row * n + p.answer[row]] !== 1);
      if (r < 0) return { ...s, note: 'Every ✓ you need is already there. Check your answer.' };
      const marks = s.marks.slice();
      marks[r * n + p.answer[r]] = 1;
      return { ...s, marks, hintsUsed: s.hintsUsed + 1, note: `Hint: ${p.rows[r]} had the ${p.cols[p.answer[r]].toLowerCase()}.` };
    }
    case 'reveal': {
      const marks = s.marks.map((_, i) => (p.answer[Math.floor(i / n)] === i % n ? 1 : 2) as Mark);
      return { ...s, marks, revealed: true, note: 'Here is the answer.' };
    }
  }
}

type Props = EngineViewProps<LogicGridPayload, LogicGridState, LogicGridAction>;

const WORDS = ['unmarked', 'yes', 'no'];

function View({ payload, state, dispatch }: Props) {
  const n = payload.cols.length;
  const over = state.solved || state.revealed;
  const grid = useRovingGrid(payload.rows.length * n, n);

  return (
    <div className="eng">
      <ol className="lgd-clues" aria-label="Clues">
        {payload.clues.map((c) => <li key={c.text}>{c.text}</li>)}
      </ol>

      <div className="lgd-table" role="group" aria-label="Answer grid" onKeyDown={grid.onKeyDown} style={{ gridTemplateColumns: `minmax(3.5rem, auto) repeat(${n}, minmax(0, 1fr))` }}>
        <span aria-hidden="true" />
        {payload.cols.map((c) => <span key={c} className="lgd-head" aria-hidden="true">{c}</span>)}
        {payload.rows.map((r, ri) => (
          <div key={r} style={{ display: 'contents' }}>
            <span className="lgd-row" aria-hidden="true">{r}</span>
            {payload.cols.map((c, ci) => {
              const i = ri * n + ci;
              const m = state.marks[i];
              return (
                <button
                  key={c}
                  type="button"
                  className={`lgd-cell lgd-cell--${m}`}
                  aria-label={`${r} and ${c}, ${WORDS[m]}`}
                  disabled={over}
                  onClick={() => dispatch({ type: 'cycle', index: i })}
                  {...grid.cellProps(i)}
                >
                  {m === 1 ? '✓' : m === 2 ? '×' : ''}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      {!over && <p className="small muted">Tap once for ✓, twice for ×, three times to clear.</p>}
      {!over && <button type="button" className="btn btn--block" onClick={() => dispatch({ type: 'check' })}>Check my answer</button>}
    </div>
  );
}

export const logicGrid: Engine<LogicGridPayload, LogicGridState, LogicGridAction> = {
  id: 'logic-grid',
  restartable: true,
  help:
    'Read the clues and mark each square: tap once for ✓ (yes), twice for × (no). Give every row one ✓, then check.',
  hint: true,
  revealable: true,
  init: (p) => ({ marks: Array(p.rows.length * p.cols.length).fill(0), checks: 0, hintsUsed: 0, solved: false, revealed: false, note: '' }),
  reduce: (s, a, p) => reduce(s, a, p),
  status(s) {
    return {
      done: s.solved || s.revealed,
      solved: s.solved,
      score: s.solved ? `${s.checks} ${s.checks === 1 ? 'check' : 'checks'}` : 'Revealed',
      progress: s.solved ? 'SOLVED' : `${s.marks.filter((m) => m === 1).length} ✓`,
      message: s.note,
    };
  },
  resultTitle: (s) => (s.solved ? (s.checks === 1 ? 'Solved first time.' : 'Solved.') : 'Not this time.'),
  shareLines: (s) => [s.solved ? `🟦 Solved in ${s.checks} ${s.checks === 1 ? 'check' : 'checks'}` : '⬜ Not solved'],
  View,
};
