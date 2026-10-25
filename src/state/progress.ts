import { getFormat, type FamilyId } from '../content/formats';
import { addDays, weekStart, type DateKey } from '../lib/date';

export interface PuzzleRecord {
  date: DateKey;
  formatId: string;
  themeId: string;
  issue: number;
  /** First-attempt result; never overwritten by replays or retries. */
  solved: boolean;
  /** Short score such as "4/6" or "Done". */
  score: string;
  completedAt: string;
  /** False for a Library puzzle outside the day's four. Older records don't say, and count as in the set. */
  inSet?: boolean;
}

export type ProgressMap = Record<string, PuzzleRecord>;

export const recordKey = (date: DateKey, formatId: string) => `${date}:${formatId}`;

/** Adds a first-attempt result. Returns the same map if that puzzle already has one. */
export function addRecord(progress: ProgressMap, record: PuzzleRecord): ProgressMap {
  const key = recordKey(record.date, record.formatId);
  if (progress[key]) return progress;
  return { ...progress, [key]: record };
}

export function recordsFor(progress: ProgressMap, date: DateKey): PuzzleRecord[] {
  return Object.values(progress).filter((r) => r.date === date);
}

export function playedDates(progress: ProgressMap): Set<DateKey> {
  return new Set(Object.values(progress).map((r) => r.date));
}

/** Consecutive days played, ending today (or yesterday if today isn't played yet). */
export function currentStreak(progress: ProgressMap, today: DateKey): number {
  const days = playedDates(progress);
  let day = days.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (days.has(day)) {
    n++;
    day = addDays(day, -1);
  }
  return n;
}

/** Days played in the Monday-to-Sunday week containing `today`. */
export function daysPlayedThisWeek(progress: ProgressMap, today: DateKey): number {
  const start = weekStart(today);
  const days = playedDates(progress);
  let n = 0;
  for (let i = 0; i < 7; i++) if (days.has(addDays(start, i))) n++;
  return n;
}

export function solvedCount(progress: ProgressMap): number {
  return Object.values(progress).filter((r) => r.solved).length;
}

export function solvedInFamily(progress: ProgressMap, family: FamilyId): number {
  return Object.values(progress).filter((r) => r.solved && getFormat(r.formatId)?.family === family).length;
}

export function formatsTried(progress: ProgressMap): number {
  return new Set(Object.values(progress).map((r) => r.formatId)).size;
}

/** Number of dates on which every puzzle in that date's set was completed. */
export function fullSetsCompleted(progress: ProgressMap, setSize: (date: DateKey) => number): number {
  const byDate = new Map<DateKey, number>();
  for (const r of Object.values(progress)) if (r.inSet !== false) byDate.set(r.date, (byDate.get(r.date) ?? 0) + 1);
  let n = 0;
  for (const [date, count] of byDate) if (count >= setSize(date)) n++;
  return n;
}
