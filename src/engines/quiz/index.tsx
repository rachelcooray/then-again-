import type { Engine, EngineViewProps } from '../types';
import '../engines.css';

/**
 * The quiz engine family: multiple choice, higher or lower, progressive clues and ordering.
 * Every fact carries a source so a person can check it before it's published.
 */

// ---------- The Quiz: multiple choice ----------

export interface QuizPayload {
  questions: { q: string; options: string[]; answer: number; fact: string; source: string }[];
  goal: number;
  intro: string;
}

export interface QuizState {
  i: number;
  picked: number | null;
  results: boolean[];
  note: string;
}

export type QuizAction = { type: 'pick'; option: number } | { type: 'next' };

const quizScore = (s: QuizState) => s.results.filter(Boolean).length;

function QuizView({ payload, state, dispatch }: EngineViewProps<QuizPayload, QuizState, QuizAction>) {
  if (state.i >= payload.questions.length) return <ResultDots results={state.results} />;
  const q = payload.questions[state.i];
  const answered = state.picked !== null;
  return (
    <div className="eng">
      <ResultDots results={state.results} total={payload.questions.length} current={state.i} />
      <h2 className="qz-question">{q.q}</h2>
      <div className="qz-options" role="group" aria-label="Answers">
        {q.options.map((o, k) => {
          const mark = !answered ? '' : k === q.answer ? 'is-right' : k === state.picked ? 'is-wrong' : 'is-faded';
          return (
            <button key={o} type="button" className={`qz-option ${mark}`} disabled={answered} onClick={() => dispatch({ type: 'pick', option: k })}
              aria-label={`${o}${answered && k === q.answer ? ', correct answer' : answered && k === state.picked ? ', your answer, wrong' : ''}`}>
              {answered && k === q.answer ? '✓ ' : answered && k === state.picked ? '× ' : ''}{o}
            </button>
          );
        })}
      </div>
      {answered && (
        <>
          <p className="qz-fact">{state.picked === q.answer ? 'Right. ' : 'Not quite. '}{q.fact}</p>
          <button type="button" className="btn btn--block" onClick={() => dispatch({ type: 'next' })}>
            {state.i === payload.questions.length - 1 ? 'See my score' : 'Next question'} <span aria-hidden="true">→</span>
          </button>
        </>
      )}
    </div>
  );
}

function ResultDots({ results, total = results.length, current }: { results: boolean[]; total?: number; current?: number }) {
  return (
    <ol className="qz-dots" aria-label={`${results.filter(Boolean).length} right out of ${results.length} answered`}>
      {Array.from({ length: total }, (_, k) => (
        <li key={k} className={results[k] === true ? 'is-right' : results[k] === false ? 'is-wrong' : k === current ? 'is-current' : ''} aria-hidden="true">
          {results[k] === true ? '✓' : results[k] === false ? '×' : ''}
        </li>
      ))}
    </ol>
  );
}

export const quiz: Engine<QuizPayload, QuizState, QuizAction> = {
  id: 'quiz',
  restartable: false,
  help: 'Choose an answer to see if you’re right and read a short fact, then go to the next question. On a keyboard, use Tab and Enter.',
  init: () => ({ i: 0, picked: null, results: [], note: '' }),
  reduce(s, a, p) {
    if (s.i >= p.questions.length) return s;
    if (a.type === 'pick') {
      if (s.picked !== null) return s;
      const right = a.option === p.questions[s.i].answer;
      return { ...s, picked: a.option, results: [...s.results, right], note: right ? 'Right.' : `Not quite. The answer is ${p.questions[s.i].options[p.questions[s.i].answer]}.` };
    }
    return s.picked === null ? s : { ...s, i: s.i + 1, picked: null, note: '' };
  },
  status: (s, p) => ({
    done: s.i >= p.questions.length,
    solved: s.i >= p.questions.length && quizScore(s) >= p.goal,
    score: `${quizScore(s)}/${p.questions.length}`,
    progress: `${quizScore(s)}/${p.questions.length}`,
    message: s.note,
  }),
  resultTitle: (s, p) => (quizScore(s) === p.questions.length ? 'A perfect round.' : `${quizScore(s)} out of ${p.questions.length}.`),
  shareLines: (s) => [s.results.map((r) => (r ? '🟩' : '⬜')).join('')],
  View: QuizView,
};

// ---------- Higher or Lower ----------

export interface HigherLowerPayload {
  items: { name: string; value: number; unit?: string; source: string }[];
  goal: number;
  intro: string;
}

export interface HigherLowerState {
  i: number;
  revealed: boolean;
  results: boolean[];
  note: string;
}

export type HigherLowerAction = { type: 'guess'; higher: boolean } | { type: 'next' };

const hlRounds = (p: HigherLowerPayload) => p.items.length - 1;
const hlScore = (s: HigherLowerState) => s.results.filter(Boolean).length;
const fmt = (n: number) => n.toLocaleString('en-GB');

function HigherLowerView({ payload, state, dispatch }: EngineViewProps<HigherLowerPayload, HigherLowerState, HigherLowerAction>) {
  if (state.i >= hlRounds(payload)) return <ResultDots results={state.results} />;
  const known = payload.items[state.i];
  const next = payload.items[state.i + 1];
  return (
    <div className="eng">
      <ResultDots results={state.results} total={hlRounds(payload)} current={state.i} />
      <div className="hl-card card--strong">
        <span className="kicker">{known.name}</span>
        <span className="hl-value">{fmt(known.value)}{known.unit ? ` ${known.unit}` : ''}</span>
      </div>
      <div className={`hl-card hl-card--next${state.revealed ? (state.results[state.i] ? ' is-right' : ' is-wrong') : ''}`}>
        <span className="kicker">{next.name}</span>
        <span className="hl-value">{state.revealed ? `${state.results[state.i] ? '✓' : '×'} ${fmt(next.value)}${next.unit ? ` ${next.unit}` : ''}` : '?'}</span>
      </div>
      {!state.revealed ? (
        <div className="grid-2">
          <button type="button" className="btn" onClick={() => dispatch({ type: 'guess', higher: true })}>▲ Higher</button>
          <button type="button" className="btn" onClick={() => dispatch({ type: 'guess', higher: false })}>▼ Lower</button>
        </div>
      ) : (
        <button type="button" className="btn btn--block" onClick={() => dispatch({ type: 'next' })}>
          {state.i === hlRounds(payload) - 1 ? 'See my score' : 'Next'} <span aria-hidden="true">→</span>
        </button>
      )}
    </div>
  );
}

export const higherLower: Engine<HigherLowerPayload, HigherLowerState, HigherLowerAction> = {
  id: 'quiz',
  restartable: false,
  help: 'Decide whether the second number is higher or lower than the first. If they’re equal, either answer counts. On a keyboard, use Tab and Enter.',
  init: () => ({ i: 0, revealed: false, results: [], note: '' }),
  reduce(s, a, p) {
    if (s.i >= hlRounds(p)) return s;
    if (a.type === 'guess') {
      if (s.revealed) return s;
      const [x, y] = [p.items[s.i].value, p.items[s.i + 1].value];
      const right = x === y || (a.higher ? y > x : y < x);
      return { ...s, revealed: true, results: [...s.results, right], note: `${right ? 'Right' : 'Not this time'}: ${p.items[s.i + 1].name} is ${fmt(y)}.` };
    }
    return s.revealed ? { ...s, i: s.i + 1, revealed: false, note: '' } : s;
  },
  status: (s, p) => ({
    done: s.i >= hlRounds(p),
    solved: s.i >= hlRounds(p) && hlScore(s) >= p.goal,
    score: `${hlScore(s)}/${hlRounds(p)}`,
    progress: `${hlScore(s)}/${hlRounds(p)}`,
    message: s.note,
  }),
  resultTitle: (s, p) => (hlScore(s) === hlRounds(p) ? 'A perfect run.' : `${hlScore(s)} out of ${hlRounds(p)}.`),
  shareLines: (s) => [s.results.map((r) => (r ? '🟩' : '⬜')).join('')],
  View: HigherLowerView,
};

// ---------- Mystery Object: progressive clues ----------

export interface MysteryPayload {
  clues: string[];
  options: string[];
  answer: string;
  /** Wrong guesses allowed before the answer is shown. */
  maxWrong: number;
  intro: string;
}

export interface MysteryState {
  shown: number;
  wrong: string[];
  solved: boolean;
  note: string;
}

export type MysteryAction = { type: 'clue' } | { type: 'guess'; option: string };

const points = (s: MysteryState, p: MysteryPayload) => Math.max(0, p.clues.length + 1 - s.shown - s.wrong.length);
const mysteryOver = (s: MysteryState, p: MysteryPayload) => s.solved || s.wrong.length >= p.maxWrong;

function MysteryView({ payload, state, dispatch }: EngineViewProps<MysteryPayload, MysteryState, MysteryAction>) {
  const over = mysteryOver(state, payload);
  return (
    <div className="eng">
      <ol className="mo-clues">
        {payload.clues.map((c, k) => (
          <li key={k} className={k < state.shown || over ? '' : 'is-hidden'}>{k < state.shown || over ? c : 'Hidden clue'}</li>
        ))}
      </ol>
      {!over && (
        <>
          <p className="mono small">{points(state, payload)} points if you get it now</p>
          <div className="qz-options" role="group" aria-label="What is it?">
            {payload.options.map((o) => {
              const bad = state.wrong.includes(o);
              return (
                <button key={o} type="button" className={`qz-option${bad ? ' is-wrong' : ''}`} disabled={bad} onClick={() => dispatch({ type: 'guess', option: o })}
                  aria-label={`${o}${bad ? ', wrong' : ''}`}>
                  {bad ? '× ' : ''}{o}
                </button>
              );
            })}
          </div>
          <button type="button" className="btn btn--outline btn--block" onClick={() => dispatch({ type: 'clue' })} disabled={state.shown >= payload.clues.length}>
            Show another clue (costs 1 point)
          </button>
        </>
      )}
      {over && <p className="panel__title" style={{ textAlign: 'center' }}>It’s a {payload.answer.toLowerCase()}.</p>}
    </div>
  );
}

export const mysteryObject: Engine<MysteryPayload, MysteryState, MysteryAction> = {
  id: 'quiz',
  restartable: false,
  help: 'Read the clue and pick the object. A wrong guess shows another clue. The fewer clues you need, the more points you keep.',
  init: () => ({ shown: 1, wrong: [], solved: false, note: '' }),
  reduce(s, a, p) {
    if (mysteryOver(s, p)) return s;
    if (a.type === 'clue') return s.shown < p.clues.length ? { ...s, shown: s.shown + 1, note: `Clue ${s.shown + 1} shown.` } : s;
    if (s.wrong.includes(a.option)) return s;
    if (a.option === p.answer) return { ...s, solved: true, note: `Yes, it’s a ${p.answer.toLowerCase()}.` };
    const wrong = [...s.wrong, a.option];
    const out = wrong.length >= p.maxWrong;
    return { ...s, wrong, shown: Math.min(p.clues.length, s.shown + 1), note: out ? `Not that one. It was a ${p.answer.toLowerCase()}.` : 'Not that one. Another clue is showing.' };
  },
  status: (s, p) => ({
    done: mysteryOver(s, p),
    solved: s.solved,
    score: s.solved ? `${points(s, p)} points` : 'Not found',
    progress: `${points(s, p)} PTS`,
    message: s.note,
  }),
  resultTitle: (s, p) => (s.solved ? `Solved with ${points(s, p)} points.` : `It was a ${p.answer.toLowerCase()}.`),
  shareLines: (s) => [s.solved ? `🔍 Solved with ${s.shown} ${s.shown === 1 ? 'clue' : 'clues'}` : '⬜ Not found'],
  View: MysteryView,
};

// ---------- Put It in Order ----------

export interface OrderPayload {
  /** In the right order. */
  steps: string[];
  /** Starting order, as indexes into steps. */
  start: number[];
  checks: number;
  intro: string;
}

export interface OrderState {
  order: number[];
  checksLeft: number;
  solved: boolean;
  note: string;
}

export type OrderAction = { type: 'move'; from: number; by: -1 | 1 } | { type: 'check' };

const orderOver = (s: OrderState) => s.solved || s.checksLeft === 0;

function OrderView({ payload, state, dispatch }: EngineViewProps<OrderPayload, OrderState, OrderAction>) {
  const over = orderOver(state);
  const shown = over ? payload.steps.map((_, k) => k) : state.order;
  return (
    <div className="eng">
      <ol className="po-list" aria-label={over ? 'The right order' : 'Your order'}>
        {shown.map((step, k) => (
          <li key={step} className={over ? 'is-done' : ''}>
            <span className="po-n" aria-hidden="true">{k + 1}</span>
            <span className="po-text">{payload.steps[step]}</span>
            {!over && (
              <span className="po-moves">
                <button type="button" className="icon-btn" aria-label={`Move “${payload.steps[step]}” up`} disabled={k === 0} onClick={() => dispatch({ type: 'move', from: k, by: -1 })}>↑</button>
                <button type="button" className="icon-btn" aria-label={`Move “${payload.steps[step]}” down`} disabled={k === shown.length - 1} onClick={() => dispatch({ type: 'move', from: k, by: 1 })}>↓</button>
              </span>
            )}
          </li>
        ))}
      </ol>
      {!over && (
        <button type="button" className="btn btn--block" onClick={() => dispatch({ type: 'check' })}>
          Check my order ({state.checksLeft} {state.checksLeft === 1 ? 'check' : 'checks'} left)
        </button>
      )}
    </div>
  );
}

export const putInOrder: Engine<OrderPayload, OrderState, OrderAction> = {
  id: 'quiz',
  restartable: false,
  help: 'Use the up and down arrows beside each step to move it, then check your order. You have three checks. On a keyboard, Tab to an arrow and press Enter.',
  init: (p) => ({ order: p.start.slice(), checksLeft: p.checks, solved: false, note: '' }),
  reduce(s, a, p) {
    if (orderOver(s)) return s;
    if (a.type === 'move') {
      const to = a.from + a.by;
      if (to < 0 || to >= s.order.length) return s;
      const order = s.order.slice();
      [order[a.from], order[to]] = [order[to], order[a.from]];
      return { ...s, order, note: `Moved to position ${to + 1}.` };
    }
    const right = s.order.filter((step, k) => step === k).length;
    if (right === p.steps.length) return { ...s, solved: true, note: 'All in the right order.' };
    const checksLeft = s.checksLeft - 1;
    return { ...s, checksLeft, note: checksLeft ? `${right} of ${p.steps.length} are in the right place.` : `${right} of ${p.steps.length} were right. Here’s the right order.` };
  },
  status: (s, p) => ({
    done: orderOver(s),
    solved: s.solved,
    score: s.solved ? `${p.checks - s.checksLeft + 1} ${p.checks - s.checksLeft + 1 === 1 ? 'check' : 'checks'}` : 'Out of checks',
    progress: `${s.checksLeft} CHECKS`,
    message: s.note,
  }),
  resultTitle: (s) => (s.solved ? 'All in order.' : 'Here’s the right order.'),
  shareLines: (s, p) => [s.solved ? `🟩 In order with ${p.checks - s.checksLeft + 1} ${p.checks - s.checksLeft + 1 === 1 ? 'check' : 'checks'}` : '⬜ Out of checks'],
  View: OrderView,
};
