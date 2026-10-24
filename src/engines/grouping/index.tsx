import type { Engine, EngineViewProps } from '../types';
import '../engines.css';

export interface Group {
  name: string;
  items: string[];
}

export interface GroupingPayload {
  groups: Group[];
  /** Display order of all items. */
  order: string[];
  mistakesAllowed?: number;
  intro: string;
}

export interface GroupingState {
  sel: string[];
  found: number[];
  mistakes: number;
  /** One line per checked guess, for the share text: group indexes picked. */
  history: number[][];
  note: string;
}

export type GroupingAction = { type: 'toggle'; item: string } | { type: 'clear' } | { type: 'check' };

const SIZE = 4;
const allowed = (p: GroupingPayload) => p.mistakesAllowed ?? 4;
const groupOf = (p: GroupingPayload, item: string) => p.groups.findIndex((g) => g.items.includes(item));

export function isOver(s: GroupingState, p: GroupingPayload) {
  return s.found.length === p.groups.length || s.mistakes >= allowed(p);
}

function reduce(s: GroupingState, a: GroupingAction, p: GroupingPayload): GroupingState {
  if (isOver(s, p)) return s;
  switch (a.type) {
    case 'toggle': {
      if (s.sel.includes(a.item)) return { ...s, sel: s.sel.filter((x) => x !== a.item), note: '' };
      if (s.sel.length >= SIZE) return { ...s, note: 'You’ve chosen four. Tap one to swap it.' };
      return { ...s, sel: [...s.sel, a.item], note: '' };
    }
    case 'clear':
      return { ...s, sel: [], note: '' };
    case 'check': {
      if (s.sel.length !== SIZE) return { ...s, note: `Choose ${SIZE - s.sel.length} more.` };
      const gs = s.sel.map((it) => groupOf(p, it));
      const history = [...s.history, gs];
      const counts = new Map<number, number>();
      gs.forEach((g) => counts.set(g, (counts.get(g) ?? 0) + 1));
      const best = Math.max(...counts.values());
      if (best === SIZE) {
        const found = [...s.found, gs[0]];
        return { ...s, found, sel: [], history, note: `Group found: ${p.groups[gs[0]].name}.` };
      }
      const mistakes = s.mistakes + 1;
      const left = allowed(p) - mistakes;
      const tries = left ? ` ${left} ${left === 1 ? 'try' : 'tries'} left.` : '';
      return {
        ...s,
        mistakes,
        history,
        note: left === 0 ? 'Out of tries. Here are the groups.' : best === SIZE - 1 ? `One away: three of those belong together.${tries}` : `Not a group.${tries}`,
      };
    }
  }
}

type Props = EngineViewProps<GroupingPayload, GroupingState, GroupingAction>;

function View({ payload, state, dispatch }: Props) {
  const over = isOver(state, payload);
  const shown = over ? payload.groups.map((_, i) => i) : state.found;
  const remaining = payload.order.filter((it) => !state.found.includes(groupOf(payload, it)));
  const left = allowed(payload) - state.mistakes;

  return (
    <div className="eng">
      {shown.map((g) => (
        <div key={g} className={`gr-group gr-group--${g}${state.found.includes(g) ? '' : ' is-missed'}`}>
          <span className="gr-group__name">{state.found.includes(g) ? '✓ ' : ''}{payload.groups[g].name}{state.found.includes(g) ? '' : ' (missed)'}</span>
          <span className="small">{payload.groups[g].items.join(' · ')}</span>
        </div>
      ))}

      {!over && (
        <>
          <div className="gr-tiles" role="group" aria-label="Things to sort">
            {remaining.map((it) => {
              const on = state.sel.includes(it);
              return (
                <button key={it} type="button" className="gr-tile" aria-pressed={on} onClick={() => dispatch({ type: 'toggle', item: it })}>
                  {on ? '✓ ' : ''}{it}
                </button>
              );
            })}
          </div>
          <div className="gr-meta small">
            <span>{state.sel.length} of 4 chosen</span>
            <span aria-label={`${left} ${left === 1 ? 'try' : 'tries'} left`}>
              {left} {left === 1 ? 'try' : 'tries'} left <span aria-hidden="true">{'●'.repeat(left)}{'○'.repeat(state.mistakes)}</span>
            </span>
          </div>
          <div className="grid-2">
            <button type="button" className="btn btn--outline" onClick={() => dispatch({ type: 'clear' })} disabled={!state.sel.length}>Clear</button>
            <button type="button" className="btn" onClick={() => dispatch({ type: 'check' })} disabled={state.sel.length !== 4}>Check group</button>
          </div>
        </>
      )}
    </div>
  );
}

const SYMBOLS = ['🟧', '🟦', '🟩', '🟪'];

export const grouping: Engine<GroupingPayload, GroupingState, GroupingAction> = {
  id: 'grouping',
  restartable: false,
  init: () => ({ sel: [], found: [], mistakes: 0, history: [], note: '' }),
  reduce: (s, a, p) => reduce(s, a, p),
  status(s, p) {
    const solved = s.found.length === p.groups.length;
    return {
      done: isOver(s, p),
      solved,
      score: solved ? `${s.mistakes} ${s.mistakes === 1 ? 'mistake' : 'mistakes'}` : `${s.found.length}/${p.groups.length}`,
      progress: `${s.found.length}/${p.groups.length}`,
      message: s.note,
    };
  },
  resultTitle: (s, p) => (s.found.length === p.groups.length ? 'All four groups.' : 'Out of tries.'),
  shareLines: (s) => s.history.map((gs) => gs.map((g) => SYMBOLS[g % SYMBOLS.length]).join('')),
  View,
};
