import type { Engine, EngineViewProps } from '../types';
import { useRovingGrid } from '../useRovingGrid';
import { useTypingKeys } from '../useTypingKeys';
import type { GridShape } from './solver';
import '../engines.css';

export interface NumberGridPayload extends GridShape {
  /** Row by row, 0 for empty. */
  givens: string;
  solution: string;
}

export interface NumberGridState {
  values: number[];
  sel: number | null;
  wrong: number[];
  hintsUsed: number;
  revealed: boolean;
  note: string;
}

export type NumberGridAction =
  | { type: 'select'; index: number }
  | { type: 'put'; value: number }
  | { type: 'check' }
  | { type: 'hint' }
  | { type: 'reveal' };

const digits = (s: string) => s.split('').map(Number);
const FREE_HINTS = 1;

export function isSolved(s: NumberGridState, p: NumberGridPayload) {
  const sol = digits(p.solution);
  return s.values.every((v, i) => v === sol[i]);
}

function reduce(s: NumberGridState, a: NumberGridAction, p: NumberGridPayload): NumberGridState {
  if (s.revealed || isSolved(s, p)) return s;
  const givens = digits(p.givens);
  const sol = digits(p.solution);
  switch (a.type) {
    case 'select':
      return { ...s, sel: a.index, note: '' };
    case 'put': {
      if (s.sel === null) return { ...s, note: 'Choose a square first.' };
      if (givens[s.sel]) return { ...s, note: 'That number is part of the puzzle.' };
      const values = s.values.slice();
      values[s.sel] = a.value;
      const next = { ...s, values, wrong: s.wrong.filter((w) => w !== s.sel), note: '' };
      return isSolved(next, p) ? { ...next, note: 'Every number in its place.' } : next;
    }
    case 'check': {
      const wrong = s.values.map((v, i) => (v && v !== sol[i] ? i : -1)).filter((i) => i >= 0);
      const left = s.values.filter((v) => !v).length;
      return {
        ...s,
        wrong,
        note: wrong.length
          ? `${wrong.length} ${wrong.length === 1 ? 'number doesn’t' : 'numbers don’t'} fit. They’re underlined.`
          : `Everything so far is right. ${left} to go.`,
      };
    }
    case 'hint': {
      if (s.hintsUsed >= FREE_HINTS) return { ...s, note: 'You’ve used today’s free hint.' };
      let i = s.sel;
      if (i === null || givens[i] || s.values[i] === sol[i]) i = s.values.findIndex((v, k) => v !== sol[k]);
      const values = s.values.slice();
      values[i] = sol[i];
      const next = { ...s, values, sel: i, hintsUsed: s.hintsUsed + 1, wrong: s.wrong.filter((w) => w !== i), note: 'Hint: one square filled in for you.' };
      return isSolved(next, p) ? { ...next, note: 'Every number in its place.' } : next;
    }
    case 'reveal':
      return { ...s, values: sol, revealed: true, wrong: [], note: 'Here is the finished grid.' };
  }
}

type Props = EngineViewProps<NumberGridPayload, NumberGridState, NumberGridAction>;

function View({ payload, state, dispatch }: Props) {
  const { size, boxRows, boxCols } = payload;
  const givens = digits(payload.givens);
  const over = state.revealed || isSolved(state, payload);
  const grid = useRovingGrid(size * size, size, state.sel ?? givens.findIndex((g) => !g));

  useTypingKeys(!over, (key) => {
    const n = Number(key);
    if (Number.isInteger(n) && n >= 1 && n <= size) dispatch({ type: 'put', value: n });
    else if (key === 'Backspace' || key === 'Delete' || key === '0') dispatch({ type: 'put', value: 0 });
    else return false;
    return true;
  });

  const sel = state.sel;
  const selVal = sel !== null ? state.values[sel] : 0;
  const peer = (i: number) =>
    sel !== null &&
    (Math.floor(i / size) === Math.floor(sel / size) ||
      i % size === sel % size ||
      (Math.floor(i / size / boxRows) === Math.floor(sel / size / boxRows) &&
        Math.floor((i % size) / boxCols) === Math.floor((sel % size) / boxCols)));

  return (
    <div className="eng">
      <div
        className={`ng-grid ng-grid--${size}`}
        role="group"
        aria-label={`Number grid, ${size} by ${size}`}
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
        onKeyDown={(e) => {
          const moved = grid.onKeyDown(e);
          if (moved !== null) dispatch({ type: 'select', index: moved });
        }}
      >
        {state.values.map((v, i) => {
          const r = Math.floor(i / size);
          const c = i % size;
          const given = givens[i] !== 0;
          const wrong = state.wrong.includes(i);
          const cls = [
            'ng-cell',
            given ? 'is-given' : 'is-entry',
            sel === i && 'is-selected',
            sel !== i && selVal && v === selVal && 'is-same',
            sel !== i && peer(i) && 'is-peer',
            wrong && 'is-wrong',
            c % boxCols === boxCols - 1 && c !== size - 1 && 'box-right',
            r % boxRows === boxRows - 1 && r !== size - 1 && 'box-bottom',
          ].filter(Boolean).join(' ');
          return (
            <button
              key={i}
              type="button"
              className={cls}
              aria-label={`Row ${r + 1}, column ${c + 1}, ${v || 'empty'}${given ? ', given' : ''}${wrong ? ', incorrect' : ''}`}
              aria-pressed={sel === i}
              disabled={over}
              onClick={() => dispatch({ type: 'select', index: i })}
              {...grid.cellProps(i)}
            >
              {v || ''}
            </button>
          );
        })}
      </div>

      {!over && (
        <>
          <div className="ng-pad" role="group" aria-label="Numbers">
            {Array.from({ length: size }, (_, k) => k + 1).map((n) => (
              <button key={n} type="button" className="ng-key" aria-label={`Enter ${n}`} onClick={() => dispatch({ type: 'put', value: n })}>
                {n}
              </button>
            ))}
            <button type="button" className="ng-key" aria-label="Erase" onClick={() => dispatch({ type: 'put', value: 0 })}>⌫</button>
          </div>
          <button type="button" className="btn btn--outline btn--block" onClick={() => dispatch({ type: 'check' })}>Check my grid</button>
        </>
      )}
    </div>
  );
}

export const numberGrid: Engine<NumberGridPayload, NumberGridState, NumberGridAction> = {
  id: 'number-grid',
  restartable: true,
  hint: true,
  revealable: true,
  init: (p) => ({ values: digits(p.givens), sel: null, wrong: [], hintsUsed: 0, revealed: false, note: '' }),
  reduce: (s, a, p) => reduce(s, a, p),
  status(s, p) {
    const solved = !s.revealed && isSolved(s, p);
    const left = s.values.filter((v) => !v).length;
    return {
      done: solved || s.revealed,
      solved,
      score: solved ? (s.hintsUsed ? `Solved, ${s.hintsUsed} hint` : 'Solved') : 'Revealed',
      progress: `${left} LEFT`,
      message: s.note,
    };
  },
  resultTitle: (s) => (s.revealed ? 'Not this time.' : 'Every number in its place.'),
  shareLines: (s, p) => [!s.revealed && isSolved(s, p) ? `🟦 Solved${s.hintsUsed ? ' with a hint' : ''}` : '⬜ Not solved'],
  View,
};
