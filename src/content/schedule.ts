import type { Puzzle } from '../engines/types';
import { addDays, type DateKey } from '../lib/date';
import manifest from './generated/manifest.json';
import { openDay } from './schedule-codec';

/** One day of the generated calendar (scripts/content/plan.ts). */
export interface ScheduledDay {
  themeId: string;
  /** 1 easy, 2 medium, 3 hard, following the week. */
  level: 1 | 2 | 3;
  /** The day's four, featured first. */
  formats: string[];
  /** A puzzle for every generated format, keyed by format id. */
  puzzles: Record<string, Puzzle>;
  /** On link days, what the four puzzles' key words have in common. */
  link?: DayLink;
}

export interface DayLink {
  answer: string;
  /** Four choices, the answer among them. */
  options: string[];
  explain: string;
}

export const LEVEL_NAME = { 1: 'Easy', 2: 'Medium', 3: 'Hard' } as const;

export const scheduleRange = { first: manifest.first as DateKey, last: manifest.last as DateKey };

// Each day is its own small file, loaded when needed, so the app doesn't carry months of puzzles up front.
const DAY_FILES = import.meta.glob<string>('./generated/days/*.json', { import: 'default' });
const sealedDays = new Map<DateKey, string>();
const opened = new Map<DateKey, ScheduledDay | null>();

/**
 * Tests and design reviews can play the original design puzzles every day by setting
 * localStorage "then-again:content" to "canvas".
 */
function usingCanvas(): boolean {
  try {
    return localStorage.getItem('then-again:content') === 'canvas';
  } catch {
    return false;
  }
}

async function loadDay(date: DateKey): Promise<void> {
  const file = DAY_FILES[`./generated/days/${date}.json`];
  if (!file || sealedDays.has(date)) return;
  sealedDays.set(date, await file());
}

/** Loads a date with the day before (late-night play) and the day after (midnight). */
export async function loadScheduleAround(date: DateKey): Promise<void> {
  if (usingCanvas()) return;
  await Promise.all([addDays(date, -1), date, addDays(date, 1)].map((d) => loadDay(d).catch(() => undefined)));
}

/** Every scheduled date, for the admin pages. */
export function scheduledDates(): DateKey[] {
  return Object.keys(DAY_FILES).map((f) => f.slice(-15, -5)).sort();
}

/** Loads the whole calendar (admin pages only; players load just the days around today). */
export async function loadWholeSchedule(): Promise<void> {
  await Promise.all(scheduledDates().map((d) => loadDay(d).catch(() => undefined)));
}

/** The generated day, if it is scheduled and its month has loaded. */
export function scheduledDay(date: DateKey): ScheduledDay | undefined {
  if (usingCanvas()) return undefined;
  if (opened.has(date)) return opened.get(date) ?? undefined;
  const sealed = sealedDays.get(date);
  if (!sealed) return undefined;
  let day: ScheduledDay | null = null;
  try {
    day = openDay<ScheduledDay>(date, sealed);
  } catch {
    day = null;
  }
  opened.set(date, day);
  return day ?? undefined;
}
