import type { Engine, EngineViewProps } from '../types';
import { useRovingGrid } from '../useRovingGrid';
import { clues, runs, type PictureLogicPayload } from './logic';
import '../engines.css';

export { countNonogramSolutions, type PictureLogicPayload } from './logic';

/** 0 blank, 1 filled, 2 marked empty. */
type Cell = 0 | 1 | 2;

export interface PictureLogicState {
  g: Cell[];
  mode: 'fill' | 'mark';
  hintsUsed: number;
  revealed: boolean;
  note: string;
}

export type PictureLogicAction =
  | { type: 'tap'; index: number }
  | { type: 'mode'; mode: 'fill' | 'mark' }
  | { type: 'hint' }
  | { type: 'reveal' };

const FREE_HINTS = 1;
const bits = (p: PictureLogicPayload) => p.solution.split('').map(Number);
const isSolved = (s: PictureLogicState, p: PictureLogicPayload) => bits(p).every((b, i) => (s.g[i] === 1 ? 1 : 0) === b);

function reduce(s: PictureLogicState, a: PictureLogicAction, p: PictureLogicPayload): PictureLogicState {
  if (s.revealed || isSolved(s, p)) return s;
  switch (a.type) {
    case 'mode':
      return { ...s, mode: a.mode, note: a.mode === 'fill' ? 'Fill mode.' : 'Mark mode: tap squares you know are empty.' };
    case 'tap': {
      const g = s.g.slice();
      const want: Cell = s.mode === 'fill' ? 1 : 2;
      g[a.index] = g[a.index] === want ? 0 : want;
      const next = { ...s, g, note: '' };
      return isSolved(next, p) ? { ...next, note: `Solved: ${p.title}` } : next;
    }
    case 'hint': {
      if (s.hintsUsed >= FREE_HINTS) return { ...s, note: 'You’ve used today’s free hint.' };
      const b = bits(p);
      const i = b.findIndex((x, k) => (s.g[k] === 1 ? 1 : 0) !== x);
      const g = s.g.slice();
      g[i] = b[i] ? 1 : 2;
      const next = { ...s, g, hintsUsed: s.hintsUsed + 1, note: `Hint: row ${Math.floor(i / p.cols) + 1}, column ${(i % p.cols) + 1} is ${b[i] ? 'filled' : 'empty'}.` };
      return isSolved(next, p) ? { ...next, note: `Solved: ${p.title}` } : next;
    }
    case 'reveal':
      return { ...s, g: bits(p).map((b) => (b ? 1 : 0)) as Cell[], revealed: true, note: `The picture was ${p.title.toLowerCase()}` };
  }
}

type Props = EngineViewProps<PictureLogicPayload, PictureLogicState, PictureLogicAction>;

function View({ payload, state, dispatch }: Props) {
  const { cols } = payload;
  const c = clues(payload);
  const rows = c.rows.length;
  const over = state.revealed || isSolved(state, payload);
  const grid = useRovingGrid(rows * cols, cols);
  const filled = state.g.map((x) => (x === 1 ? 1 : 0));
  const rowMatch = (r: number) => runs(filled.slice(r * cols, (r + 1) * cols)).join() === c.rows[r].join();
  const colMatch = (k: number) => runs(Array.from({ length: rows }, (_, r) => filled[r * cols + k])).join() === c.cols[k].join();
  const words = (cl: number[]) => (cl.length ? cl.join(', ') : 'none');

  return (
    <div className="eng">
      {!over && (
        <div className="segmented" role="radiogroup" aria-label="What a tap does">
          <button type="button" role="radio" aria-checked={state.mode === 'fill'} onClick={() => dispatch({ type: 'mode', mode: 'fill' })}>■ Fill</button>
          <button type="button" role="radio" aria-checked={state.mode === 'mark'} onClick={() => dispatch({ type: 'mode', mode: 'mark' })}>× Mark empty</button>
        </div>
      )}
      <div className="ngm" style={{ gridTemplateColumns: `auto repeat(${cols}, minmax(0, 1fr))` }}>
        <span aria-hidden="true" />
        {c.cols.map((cl, k) => (
          <span key={k} className={`ngm-clue ngm-clue--col${colMatch(k) ? ' is-done' : ''}`} aria-hidden="true">
            {colMatch(k) && <span>✓</span>}
            {(cl.length ? cl : [0]).map((n, j) => <span key={j}>{n}</span>)}
          </span>
        ))}
        <div className="ngm-cells" role="group" aria-label={`Picture grid, ${cols} by ${rows}`} onKeyDown={grid.onKeyDown}
          style={{ gridColumn: `2 / span ${cols}`, gridRow: `2 / span ${rows}`, gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {state.g.map((st, i) => {
            const r = Math.floor(i / cols);
            const k = i % cols;
            return (
              <button
                key={i}
                type="button"
                className={`ngm-cell ngm-cell--${st}`}
                aria-label={`Row ${r + 1} (clue ${words(c.rows[r])}), column ${k + 1} (clue ${words(c.cols[k])}), ${st === 1 ? 'filled' : st === 2 ? 'marked empty' : 'blank'}`}
                disabled={over}
                onClick={() => dispatch({ type: 'tap', index: i })}
                {...grid.cellProps(i)}
              >
                {st === 2 ? '×' : ''}
              </button>
            );
          })}
        </div>
        {c.rows.map((cl, r) => (
          <span key={r} className={`ngm-clue ngm-clue--row${rowMatch(r) ? ' is-done' : ''}`} style={{ gridColumn: 1, gridRow: r + 2 }} aria-hidden="true">
            {rowMatch(r) ? '✓ ' : ''}{(cl.length ? cl : [0]).join(' ')}
          </span>
        ))}
      </div>
      {over && <p className="panel__title" style={{ textAlign: 'center' }}>{payload.title}</p>}
    </div>
  );
}

export const pictureLogic: Engine<PictureLogicPayload, PictureLogicState, PictureLogicAction> = {
  id: 'picture-logic',
  restartable: true,
  help: 'The numbers beside each row and above each column are the runs of filled squares, in order. Choose Fill or Mark empty, then tap squares. On a keyboard, move with the arrow keys and press Enter. A clue gets a ✓ when its line matches.',
  hint: true,
  revealable: true,
  init: (p) => ({ g: Array(p.solution.length).fill(0), mode: 'fill', hintsUsed: 0, revealed: false, note: '' }),
  reduce: (s, a, p) => reduce(s, a, p),
  status(s, p) {
    const solved = !s.revealed && isSolved(s, p);
    const filled = s.g.filter((x) => x === 1).length;
    return { done: solved || s.revealed, solved, score: solved ? (s.hintsUsed ? 'Solved, 1 hint' : 'Solved') : 'Revealed', progress: `${filled}/${bits(p).filter(Boolean).length}`, message: s.note };
  },
  resultTitle: (s, p) => (s.revealed ? 'Not this time.' : `It’s ${p.title.charAt(0).toLowerCase()}${p.title.slice(1)}`),
  shareLines: (s, p) => [!s.revealed && isSolved(s, p) ? `🟦 Picture revealed${s.hintsUsed ? ' with a hint' : ''}` : '⬜ Not solved'],
  View,
};
