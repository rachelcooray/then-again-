import type { Puzzle } from '../engines/types';
import type { DateKey } from '../lib/date';
import { canvasPuzzle } from './canvas';
import { scheduledDay } from './schedule';

/** The puzzle a format plays on a date: the generated one, or the design puzzle when there isn't one. */
export function getPuzzle(date: DateKey, formatId: string): Puzzle | undefined {
  return scheduledDay(date)?.puzzles[formatId] ?? canvasPuzzle(formatId);
}
