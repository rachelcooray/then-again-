import type { DailySet } from '../content/daily';
import { FAMILIES, getFormat, type FamilyId } from '../content/formats';
import type { DayLink } from '../content/schedule';
import { compactDate, formatIssue } from '../lib/date';
import { recordKey, type ProgressMap, type PuzzleRecord } from './progress';

/** Two tries at the link: one to think, one to change your mind. */
export const LINK_TRIES = 2;

export interface DayProgress {
  records: (PuzzleRecord | undefined)[];
  done: number;
  complete: boolean;
}

export function dayProgress(set: DailySet, progress: ProgressMap): DayProgress {
  const records = set.formats.map((f) => progress[recordKey(set.date, f)]);
  const done = records.filter(Boolean).length;
  return { records, done, complete: done === set.formats.length };
}

export interface LinkOutcome {
  solved: boolean;
  /** Solved, or out of tries. */
  over: boolean;
  triesLeft: number;
  /** The try it was found on, from 1. */
  foundOn?: number;
}

export function linkOutcome(link: DayLink, guesses: readonly string[] = []): LinkOutcome {
  const at = guesses.indexOf(link.answer);
  const solved = at >= 0;
  const triesLeft = Math.max(0, LINK_TRIES - guesses.length);
  return { solved, over: solved || triesLeft === 0, triesLeft, foundOn: solved ? at + 1 : undefined };
}

const SQUARE: Record<FamilyId, string> = { word: '🟧', search: '🟨', logic: '🟦', connect: '🟪' };

/** The day's share card as text: one row per puzzle and the link, with no answers in it. */
export function dayShareText(set: DailySet, progress: ProgressMap, guesses: readonly string[] = []): string {
  const lines = [`Then Again ${formatIssue(set.issue)} · ${compactDate(set.date)}`];
  set.formats.forEach((id) => {
    const f = getFormat(id)!;
    const r = progress[recordKey(set.date, id)];
    lines.push(`${r?.solved ? SQUARE[f.family] : '⬜'} ${f.name} ${r ? r.score : '·'}`);
  });
  if (set.link) {
    const o = linkOutcome(set.link, guesses);
    lines.push(o.solved ? `🔗 Link found ${o.foundOn === 1 ? 'first try' : 'on the second try'}` : o.over ? '🔗 Link missed' : '🔗 Link still to find');
  }
  return lines.join('\n');
}

export const familyLabel = (id: string) => FAMILIES[getFormat(id)!.family].shortKicker;
