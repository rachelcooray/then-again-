import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import type { Engine, EngineViewProps } from '../types';
import { useRovingGrid } from '../useRovingGrid';
import { useTypingKeys } from '../useTypingKeys';
import { runsOf, type SumGridPayload } from './logic';
import '../engines.css';

export { countKakuroSolutions, runsOf, type Run, type SumGridPayload } from './logic';

export interface SumGridState {
  values: number[];
  sel: number | null;
  wrong: number[];
  hintsUsed: number;
  revealed: boolean;
  note: string;
}

export type SumGridAction =
  | { type: 'select'; index: number }
  | { type: 'put'; value: number }
  | { type: 'check' }
  | { type: 'hint' }
  | { type: 'reveal' };

const FREE_HINTS = 1;
const isWhite = (p: SumGridPayload, i: number) => p.solution[i] !== '#';
const sol = (p: SumGridPayload) => p.solution.split('').map((ch) => (ch === '#' ? 0 : Number(ch)));
const isSolved = (s: SumGridState, p: SumGridPayload) => sol(p).every((n, i) => !n || s.values[i] === n);

function reduce(s: SumGridState, a: SumGridAction, p: SumGridPayload): SumGridState {
  if (s.revealed || isSolved(s, p)) return s;
  const answer = sol(p);
  switch (a.type) {
    case 'select':
      return isWhite(p, a.index) ? { ...s, sel: a.index, note: '' } : s;
    case 'put': {
      if (s.sel === null) return { ...s, note: 'Choose a white square first.' };
      const values = s.values.slice();
      values[s.sel] = a.value;
      const next = { ...s, values, wrong: s.wrong.filter((w) => w !== s.sel), note: '' };
      return isSolved(next, p) ? { ...next, note: 'Every sum adds up.' } : next;
    }
    case 'check': {
      const wrong = s.values.map((v, i) => (v && v !== answer[i] ? i : -1)).filter((i) => i >= 0);
      return { ...s, wrong, note: wrong.length ? `${wrong.length} ${wrong.length === 1 ? 'number doesn’t' : 'numbers don’t'} fit. They’re underlined.` : 'Everything so far is right.' };
    }
    case 'hint': {
      if (s.hintsUsed >= FREE_HINTS) return { ...s, note: 'You’ve used today’s free hint.' };
      const i = s.sel !== null && s.values[s.sel] !== answer[s.sel] ? s.sel : answer.findIndex((n, k) => n && s.values[k] !== n);
      const values = s.values.slice();
      values[i] = answer[i];
      const next = { ...s, values, sel: i, hintsUsed: s.hintsUsed + 1, wrong: s.wrong.filter((w) => w !== i), note: 'Hint: one square filled in for you.' };
      return isSolved(next, p) ? { ...next, note: 'Every sum adds up.' } : next;
    }
    case 'reveal':
      return { ...s, values: answer, revealed: true, wrong: [], note: 'Here is the finished grid.' };
  }
}

type Props = EngineViewProps<SumGridPayload, SumGridState, SumGridAction>;

function View({ payload, state, dispatch }: Props) {
  const { cols } = payload;
  const cells = payload.solution.length;
  const runs = runsOf(payload);
  const over = state.revealed || isSolved(state, payload);
  const firstWhite = payload.solution.split('').findIndex((ch) => ch !== '#');
  const grid = useRovingGrid(cells, cols, state.sel ?? firstWhite);

  useTypingKeys(!over, (key) => {
    const n = Number(key);
    if (Number.isInteger(n) && n >= 1 && n <= 9) dispatch({ type: 'put', value: n });
    else if (key === 'Backspace' || key === 'Delete' || key === '0') dispatch({ type: 'put', value: 0 });
    else return false;
    return true;
  });

  const runDone = (cellsOfRun: number[], sum: number) => {
    const vals = cellsOfRun.map((i) => state.values[i]);
    return vals.every(Boolean) && vals.reduce((x, y) => x + y, 0) === sum && new Set(vals).size === vals.length;
  };

  // Arrow keys jump over black squares to the next white one.
  const onKeyDown = (e: ReactKeyboardEvent) => {
    const step = ({ ArrowLeft: -1, ArrowRight: 1, ArrowUp: -cols, ArrowDown: cols } as Record<string, number>)[e.key];
    if (!step) return;
    e.preventDefault();
    const from = grid.active;
    let to = from + step;
    const sameRow = (i: number) => Math.abs(step) !== 1 || Math.floor(i / cols) === Math.floor(from / cols);
    while (to >= 0 && to < cells && sameRow(to) && !isWhite(payload, to)) to += step;
    if (to >= 0 && to < cells && sameRow(to) && isWhite(payload, to)) {
      grid.focusCell(to);
      dispatch({ type: 'select', index: to });
    }
  };

  return (
    <div className="eng">
      <div className="kk-grid" role="group" aria-label="Sum grid" onKeyDown={onKeyDown} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {payload.solution.split('').map((ch, i) => {
          if (ch === '#') {
            const across = runs.find((r) => r.dir === 'across' && r.clue === i);
            const down = runs.find((r) => r.dir === 'down' && r.clue === i);
            const words = [across && `row to the right adds up to ${across.sum}`, down && `column below adds up to ${down.sum}`].filter(Boolean).join(', ');
            return (
              <span key={i} className="kk-clue" role={words ? 'img' : undefined} aria-label={words || undefined} aria-hidden={words ? undefined : true}>
                {down && <span className={`kk-down${runDone(down.cells, down.sum) ? ' is-done' : ''}`}>{runDone(down.cells, down.sum) ? '✓' : ''}{down.sum}↓</span>}
                {across && <span className={`kk-across${runDone(across.cells, across.sum) ? ' is-done' : ''}`}>{runDone(across.cells, across.sum) ? '✓' : ''}{across.sum}→</span>}
              </span>
            );
          }
          const v = state.values[i];
          const wrong = state.wrong.includes(i);
          return (
            <button
              key={i}
              type="button"
              className={`ng-cell is-entry is-boxed${state.sel === i ? ' is-selected' : ''}${wrong ? ' is-wrong' : ''}`}
              aria-label={`Row ${Math.floor(i / cols) + 1}, column ${(i % cols) + 1}, ${v || 'empty'}${wrong ? ', incorrect' : ''}`}
              aria-pressed={state.sel === i}
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
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button key={n} type="button" className="ng-key" aria-label={`Enter ${n}`} onClick={() => dispatch({ type: 'put', value: n })}>{n}</button>
            ))}
            <button type="button" className="ng-key" aria-label="Erase" onClick={() => dispatch({ type: 'put', value: 0 })}>⌫</button>
          </div>
          <button type="button" className="btn btn--outline btn--block" onClick={() => dispatch({ type: 'check' })}>Check my grid</button>
        </>
      )}
    </div>
  );
}

export const sumGrid: Engine<SumGridPayload, SumGridState, SumGridAction> = {
  id: 'sum-grid',
  restartable: true,
  help: 'Choose a white square, then a number. On a keyboard, move with the arrow keys and type 1 to 9. A clue gets a ✓ when its row or column adds up with no repeats.',
  hint: true,
  revealable: true,
  init: (p) => ({ values: Array(p.solution.length).fill(0), sel: null, wrong: [], hintsUsed: 0, revealed: false, note: '' }),
  reduce: (s, a, p) => reduce(s, a, p),
  status(s, p) {
    const solved = !s.revealed && isSolved(s, p);
    const left = sol(p).filter((n, i) => n && !s.values[i]).length;
    return { done: solved || s.revealed, solved, score: solved ? (s.hintsUsed ? 'Solved, 1 hint' : 'Solved') : 'Revealed', progress: `${left} LEFT`, message: s.note };
  },
  resultTitle: (s) => (s.revealed ? 'Not this time.' : 'Every sum adds up.'),
  shareLines: (s, p) => [!s.revealed && isSolved(s, p) ? `🟦 Solved${s.hintsUsed ? ' with a hint' : ''}` : '⬜ Not solved'],
  View,
};
