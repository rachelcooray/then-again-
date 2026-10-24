import type { Engine, EngineViewProps } from '../types';
import { useRovingGrid } from '../useRovingGrid';
import { countAround, flood, type HiddenCellsPayload } from './logic';
import '../engines.css';

export { solvableWithoutGuessing, type HiddenCellsPayload } from './logic';

export interface HiddenCellsState {
  open: number[];
  flags: number[];
  mode: 'dig' | 'flag';
  boom: number | null;
  note: string;
}

export type HiddenCellsAction = { type: 'tap'; index: number } | { type: 'mode'; mode: 'dig' | 'flag' };

const safeCount = (p: HiddenCellsPayload) => p.rows * p.cols - p.mines.length;
const isWon = (s: HiddenCellsState, p: HiddenCellsPayload) => s.boom === null && s.open.length === safeCount(p);

function reduce(s: HiddenCellsState, a: HiddenCellsAction, p: HiddenCellsPayload): HiddenCellsState {
  if (s.boom !== null || isWon(s, p)) return s;
  if (a.type === 'mode') return { ...s, mode: a.mode, note: a.mode === 'dig' ? 'Uncover mode.' : 'Flag mode: tap where you think a mine is.' };
  const i = a.index;
  if (s.open.includes(i)) {
    const n = countAround(i, p);
    return { ...s, note: n ? `${n} ${n === 1 ? 'mine touches' : 'mines touch'} this square.` : 'No mines touch this square.' };
  }
  if (s.mode === 'flag') {
    const on = s.flags.includes(i);
    return { ...s, flags: on ? s.flags.filter((x) => x !== i) : [...s.flags, i], note: on ? 'Flag removed.' : 'Flagged.' };
  }
  if (s.flags.includes(i)) return { ...s, note: 'That square is flagged. Switch to Flag mode to remove it.' };
  if (p.mines.includes(i)) return { ...s, boom: i, note: 'That one was a mine.' };
  const open = flood(s.open, i, p);
  const next = { ...s, open, flags: s.flags.filter((f) => !open.includes(f)), note: '' };
  const n = countAround(i, p);
  return isWon(next, p) ? { ...next, note: 'Field cleared.' } : { ...next, note: n ? `${n} ${n === 1 ? 'mine' : 'mines'} nearby.` : 'Clear area opened.' };
}

type Props = EngineViewProps<HiddenCellsPayload, HiddenCellsState, HiddenCellsAction>;

function View({ payload, state, dispatch }: Props) {
  const { rows, cols, mines } = payload;
  const over = state.boom !== null || isWon(state, payload);
  const grid = useRovingGrid(rows * cols, cols, payload.start);

  return (
    <div className="eng">
      {!over && (
        <div className="segmented" role="radiogroup" aria-label="What a tap does">
          <button type="button" role="radio" aria-checked={state.mode === 'dig'} onClick={() => dispatch({ type: 'mode', mode: 'dig' })}>Uncover</button>
          <button type="button" role="radio" aria-checked={state.mode === 'flag'} onClick={() => dispatch({ type: 'mode', mode: 'flag' })}>⚑ Flag</button>
        </div>
      )}
      <div className="ms-grid" role="group" aria-label={`Minefield, ${cols} by ${rows}`} onKeyDown={grid.onKeyDown} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {Array.from({ length: rows * cols }, (_, i) => {
          const isOpen = state.open.includes(i);
          const flag = state.flags.includes(i);
          const mine = mines.includes(i);
          const n = countAround(i, payload);
          let text = '';
          let cls = 'ms-cell';
          let label = 'hidden';
          if (isOpen) {
            text = n ? String(n) : '';
            cls += ` is-open ms-n${n}`;
            label = n ? `${n} ${n === 1 ? 'mine' : 'mines'} nearby` : 'no mines nearby';
          } else if (over && mine) {
            text = '✸';
            cls += i === state.boom ? ' is-boom' : ' is-mine';
            label = i === state.boom ? 'mine, the one you uncovered' : 'mine';
          } else if (flag) {
            text = '⚑';
            cls += ' is-flag';
            label = 'flagged';
          }
          return (
            <button
              key={i}
              type="button"
              className={cls}
              aria-label={`Row ${Math.floor(i / cols) + 1}, column ${(i % cols) + 1}, ${label}`}
              disabled={over}
              onClick={() => dispatch({ type: 'tap', index: i })}
              {...grid.cellProps(i)}
            >
              {text}
            </button>
          );
        })}
      </div>
      <p className="small muted">{mines.length - state.flags.length} flags left to place.</p>
    </div>
  );
}

export const hiddenCells: Engine<HiddenCellsPayload, HiddenCellsState, HiddenCellsAction> = {
  id: 'hidden-cells',
  restartable: false,
  help: 'Uncover squares that are safe. A number shows how many of the eight squares around it hide a mine. Switch to Flag to mark a mine without uncovering it. On a keyboard, move with the arrow keys and press Enter.',
  init: (p) => ({ open: flood([], p.start, p), flags: [], mode: 'dig', boom: null, note: '' }),
  reduce: (s, a, p) => reduce(s, a, p),
  status(s, p) {
    const won = isWon(s, p);
    return {
      done: won || s.boom !== null,
      solved: won,
      score: won ? 'Cleared' : `${s.open.length}/${safeCount(p)} safe`,
      progress: `${p.mines.length - s.flags.length} ⚑`,
      message: s.note,
    };
  },
  resultTitle: (s, p) => (isWon(s, p) ? 'Field cleared. Not a single mine touched.' : 'Boom. That one was a mine.'),
  shareLines: (s, p) => [isWon(s, p) ? '🟩 Field cleared' : `💥 ${s.open.length} of ${safeCount(p)} safe squares`],
  View,
};
