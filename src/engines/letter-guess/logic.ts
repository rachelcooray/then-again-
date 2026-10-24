export interface LetterGuessPayload {
  answer: string;
  clue: string;
  maxGuesses?: number;
}

export type Mark = 'correct' | 'present' | 'absent';

export interface LetterGuessState {
  guesses: string[];
  typed: string;
  note: string;
}

export type LetterGuessAction =
  | { type: 'letter'; letter: string }
  | { type: 'delete' }
  | { type: 'enter' };

export const DEFAULT_MAX_GUESSES = 6;

/** Marks each letter of a guess, handling repeated letters the way players expect. */
export function scoreGuess(guess: string, answer: string): Mark[] {
  const marks: Mark[] = Array(answer.length).fill('absent');
  const used = Array(answer.length).fill(false);
  for (let i = 0; i < answer.length; i++) {
    if (guess[i] === answer[i]) {
      marks[i] = 'correct';
      used[i] = true;
    }
  }
  for (let i = 0; i < answer.length; i++) {
    if (marks[i] === 'correct') continue;
    for (let j = 0; j < answer.length; j++) {
      if (!used[j] && answer[j] === guess[i]) {
        marks[i] = 'present';
        used[j] = true;
        break;
      }
    }
  }
  return marks;
}

/** Best mark seen for each letter, for the on-screen keyboard. */
export function keyMarks(guesses: string[], answer: string): Record<string, Mark> {
  const rank: Record<Mark, number> = { absent: 1, present: 2, correct: 3 };
  const best: Record<string, Mark> = {};
  for (const g of guesses) {
    scoreGuess(g, answer).forEach((m, i) => {
      if (!best[g[i]] || rank[m] > rank[best[g[i]]]) best[g[i]] = m;
    });
  }
  return best;
}

export function maxGuesses(p: LetterGuessPayload) {
  return p.maxGuesses ?? DEFAULT_MAX_GUESSES;
}

export function isOver(s: LetterGuessState, p: LetterGuessPayload) {
  return s.guesses.includes(p.answer) || s.guesses.length >= maxGuesses(p);
}

export function init(): LetterGuessState {
  return { guesses: [], typed: '', note: '' };
}

export function reduce(
  s: LetterGuessState,
  a: LetterGuessAction,
  p: LetterGuessPayload,
  dictionary?: ReadonlySet<string>,
): LetterGuessState {
  if (isOver(s, p)) return s;
  const len = p.answer.length;
  switch (a.type) {
    case 'letter': {
      const letter = a.letter.toUpperCase();
      if (!/^[A-Z]$/.test(letter) || s.typed.length >= len) return s;
      return { ...s, typed: s.typed + letter, note: '' };
    }
    case 'delete':
      return { ...s, typed: s.typed.slice(0, -1), note: '' };
    case 'enter': {
      if (s.typed.length < len) return { ...s, note: `${len} letters, please.` };
      if (s.typed !== p.answer && dictionary && !dictionary.has(s.typed)) {
        return { ...s, note: `${s.typed} isn’t in our word list. Try another word.` };
      }
      return { guesses: [...s.guesses, s.typed], typed: '', note: '' };
    }
  }
}
