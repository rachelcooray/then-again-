import type { ComponentType } from 'react';
import type { EngineId } from '../content/formats';

/** What every engine reports about the current attempt. */
export interface EngineStatus {
  done: boolean;
  solved: boolean;
  /** Short score shown in results and the collection, e.g. "4/6". */
  score: string;
  /** Short progress label for the header, e.g. "3/6" or "41 LEFT". */
  progress: string;
  /** Live feedback announced to screen readers. */
  message: string;
}

export interface EngineContext {
  /** Uppercase dictionary words, loaded for engines that need one. */
  dictionary?: ReadonlySet<string>;
}

export interface EngineViewProps<P, S, A> {
  payload: P;
  state: S;
  dispatch: (action: A) => void;
  status: EngineStatus;
}

/**
 * The shared engine interface (brief section 4): load a payload, handle input,
 * validate, and report progress, completion and the result. State must be plain
 * JSON so an attempt can be saved on the device and resumed.
 */
export interface Engine<P, S, A> {
  id: EngineId;
  needsDictionary?: boolean;
  init(payload: P): S;
  reduce(state: S, action: A, payload: P, ctx: EngineContext): S;
  status(state: S, payload: P): EngineStatus;
  /** Result headline when the puzzle has no written one. */
  resultTitle(state: S, payload: P): string;
  /** Spoiler-free lines for the share text. */
  shareLines(state: S, payload: P): string[];
  /**
   * Whether a mid-attempt restart is offered. Formats with limited tries don't offer it,
   * because restarting would hand out extra tries; they offer "Play again" once finished.
   */
  restartable: boolean;
  /** "How to play": the controls, beyond the one-line rules. */
  help: string;
  /** Offers a Hint button that dispatches { type: 'hint' }. */
  hint?: boolean;
  /**
   * Offers "Show the answers", which dispatches { type: 'reveal' } and ends the attempt unsolved.
   * Formats without limited tries use it as their way to give up.
   */
  revealable?: boolean;
  View: ComponentType<EngineViewProps<P, S, A>>;
}

/** A published puzzle as the app receives it. */
export interface Puzzle<P = unknown> {
  id: string;
  formatId: string;
  /** Result card: a short memory or fact. `draft` marks text no person has reviewed yet. */
  memory: { title?: string; text: string; draft?: boolean };
  payload: P;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyEngine = Engine<any, any, any>;
