import type { Engine, EngineViewProps } from '../types';
import { solved, type TileSlidePayload } from './logic';
import '../engines.css';

export { fewestMoves, isSolvable, type TileSlidePayload } from './logic';

export interface TileSlideState {
  board: number[];
  moves: number;
  revealed: boolean;
  note: string;
}

export type TileSlideAction = { type: 'slide'; tile: number } | { type: 'reveal' };

const isDone = (s: TileSlideState, size: number) => s.board.join() === solved(size).join();

function canMove(board: number[], size: number, i: number) {
  const z = board.indexOf(0);
  return Math.abs(i - z) === size || (Math.abs(i - z) === 1 && Math.floor(i / size) === Math.floor(z / size));
}

function reduce(s: TileSlideState, a: TileSlideAction, p: TileSlidePayload): TileSlideState {
  if (s.revealed || isDone(s, p.size)) return s;
  if (a.type === 'reveal') return { ...s, board: solved(p.size), revealed: true, note: 'Here is the finished order.' };
  const i = s.board.indexOf(a.tile);
  if (i < 0 || !a.tile) return s;
  if (!canMove(s.board, p.size, i)) return { ...s, note: `Tile ${a.tile} isn’t next to the gap.` };
  const board = s.board.slice();
  board[board.indexOf(0)] = a.tile;
  board[i] = 0;
  const next = { ...s, board, moves: s.moves + 1, note: '' };
  return isDone(next, p.size) ? { ...next, note: `Back in order in ${next.moves} moves.` } : next;
}

type Props = EngineViewProps<TileSlidePayload, TileSlideState, TileSlideAction>;

function View({ payload, state, dispatch }: Props) {
  const { size } = payload;
  const over = state.revealed || isDone(state, size);
  return (
    <div className="eng">
      <div className="ts-board" role="group" aria-label="Sliding tiles" style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}>
        {state.board.map((v, i) => {
          if (!v) return <span key="gap" className="ts-gap" aria-hidden="true" />;
          const can = !over && canMove(state.board, size, i);
          const home = v === i + 1;
          return (
            <button
              key={v}
              type="button"
              className={`ts-tile${home ? ' is-home' : ''}`}
              aria-label={`Tile ${v}${home ? ', in place' : ''}${can ? ', next to the gap' : ''}`}
              disabled={over}
              onClick={() => dispatch({ type: 'slide', tile: v })}
            >
              {v}
            </button>
          );
        })}
      </div>
      <p className="small muted">{state.moves} {state.moves === 1 ? 'move' : 'moves'}. Tiles already in place have a line under them.</p>
    </div>
  );
}

export const tileSlide: Engine<TileSlidePayload, TileSlideState, TileSlideAction> = {
  id: 'tile-slide',
  restartable: true,
  help: 'Tap a tile next to the gap to slide it in. Put the numbers back in order with the gap at the end. On a keyboard, Tab to a tile and press Enter.',
  revealable: true,
  init: (p) => ({ board: p.start.slice(), moves: 0, revealed: false, note: '' }),
  reduce: (s, a, p) => reduce(s, a, p),
  status(s, p) {
    const done = isDone(s, p.size);
    const won = done && !s.revealed;
    return {
      done: done || s.revealed,
      solved: won,
      score: won ? `${s.moves} moves${p.par ? ` (par ${p.par})` : ''}` : 'Revealed',
      progress: `${s.moves} MOVES`,
      message: s.note,
    };
  },
  resultTitle: (s, p) => (s.revealed ? 'Not this time.' : p.par && s.moves <= p.par ? `In order in ${s.moves}. Right on par!` : `Back in order in ${s.moves} moves.`),
  shareLines: (s, p) => [s.revealed ? '⬜ Not solved' : `🟩 ${s.moves} moves${p.par ? `, par ${p.par}` : ''}`],
  View,
};
