import type { Engine, EngineViewProps } from '../types';
import { useRovingGrid } from '../useRovingGrid';
import '../engines.css';
import { FREE, SIDE, winningLine, type CardAction, type CardPayload, type CardState } from './logic';

export { FREE, LINES, earliestLine, winningLine, type CardAction, type CardPayload, type CardState } from './logic';

const centre = (p: CardPayload) => p.card.indexOf(FREE);
const isOver = (s: CardState) => !!winningLine(s.marked) || s.ended;

function reduce(s: CardState, a: CardAction, p: CardPayload): CardState {
  if (isOver(s)) return s;
  switch (a.type) {
    case 'call': {
      if (s.called >= p.maxCalls) return s;
      const called = s.called + 1;
      const left = p.maxCalls - called;
      return { ...s, called, note: `Called: ${p.calls[called - 1]}.${left ? '' : ' That was the last call.'}` };
    }
    case 'mark': {
      const item = p.card[a.index];
      if (item === FREE) return s;
      if (s.marked.includes(a.index)) return { ...s, marked: s.marked.filter((x) => x !== a.index), note: `${item} unmarked.` };
      if (!p.calls.slice(0, s.called).includes(item)) return { ...s, note: `${item} hasn’t been called yet.` };
      const marked = [...s.marked, a.index];
      return { ...s, marked, note: winningLine(marked) ? `A full line after ${s.called} calls.` : `${item} marked.` };
    }
    case 'finish':
      return s.called >= p.maxCalls ? { ...s, ended: true, note: 'No line this time.' } : s;
  }
}

type Props = EngineViewProps<CardPayload, CardState, CardAction>;

function View({ payload, state, dispatch }: Props) {
  const line = winningLine(state.marked);
  const over = isOver(state);
  const grid = useRovingGrid(payload.card.length, SIDE);
  const last = state.called ? payload.calls[state.called - 1] : null;
  const outOfCalls = state.called >= payload.maxCalls;

  return (
    <div className="eng">
      <div className="bn-call card--strong">
        <span className="kicker">{last ? 'Just called' : 'Ready'} · {state.called}/{payload.maxCalls}</span>
        <span className="bn-call__item">{last ?? 'Press Call next to start'}</span>
      </div>

      <div className="bn-card" role="group" aria-label="Your bingo card" onKeyDown={grid.onKeyDown}>
        {payload.card.map((t, i) => {
          const on = state.marked.includes(i) || t === FREE;
          const inLine = !!line?.includes(i);
          return (
            <button
              key={i}
              type="button"
              className={`bn-cell${on ? ' is-marked' : ''}${inLine ? ' is-line' : ''}`}
              aria-pressed={on}
              aria-label={`${t === FREE ? 'Free space' : t}${on ? ', marked' : ''}${inLine ? ', in your line' : ''}`}
              disabled={over || t === FREE}
              onClick={() => dispatch({ type: 'mark', index: i })}
              {...grid.cellProps(i)}
            >
              {on && t !== FREE ? '✓ ' : ''}{t === FREE ? 'Free' : t}
            </button>
          );
        })}
      </div>

      {!over && (
        outOfCalls ? (
          <button type="button" className="btn btn--block" onClick={() => dispatch({ type: 'finish' })}>Finish game</button>
        ) : (
          <button type="button" className="btn btn--block" onClick={() => dispatch({ type: 'call' })}>Call next</button>
        )
      )}
      {!over && outOfCalls && <p className="small muted">That was the last call. Mark anything you missed, then finish.</p>}
    </div>
  );
}

export const card: Engine<CardPayload, CardState, CardAction> = {
  id: 'card',
  restartable: false,
  init: (p) => ({ called: 0, marked: [centre(p)], ended: false, note: '' }),
  reduce: (s, a, p) => reduce(s, a, p),
  status(s, p) {
    const won = !!winningLine(s.marked);
    return {
      done: isOver(s),
      solved: won,
      score: won ? `${s.called} calls` : 'No line',
      progress: `${s.called}/${p.maxCalls}`,
      message: s.note,
    };
  },
  resultTitle: (s) => (winningLine(s.marked) ? `A line in ${s.called} calls.` : 'No line this time.'),
  shareLines: (s) => [winningLine(s.marked) ? `🟩 Line after ${s.called} calls` : '⬜ No line'],
  View,
};
