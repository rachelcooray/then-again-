import { daysBetween, toDateKey } from './date';
import { enqueue } from './backend';
import { APP_VERSION, PLATFORM } from './platform';

/**
 * Anonymous usage counts for the pilot's questions: day-7 return, puzzles per visit, reminder
 * opt-in and favourite formats. There is no user or device ID. Each daily visit carries the
 * date the app was first opened and how many days later this visit is, which is enough to
 * count returning players without being able to follow any one of them.
 */

type EventName =
  | 'first_open'
  | 'daily_visit'
  | 'puzzle_complete'
  | 'set_complete'
  | 'link_result'
  | 'story_saved'
  | 'region_choice'
  | 'reminder_choice'
  | 'visit_end';

const STATE_KEY = 'then-again:usage';
let enabled = true;
let puzzlesThisVisit = 0;

interface UsageState {
  cohort: string;
  lastVisit: string;
}

function read(): UsageState | null {
  try {
    return JSON.parse(localStorage.getItem(STATE_KEY) ?? 'null') as UsageState | null;
  } catch {
    return null;
  }
}

function write(s: UsageState) {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(s));
  } catch {
    // Without storage the visit just isn't counted.
  }
}

/** Players can turn usage sharing off in Settings. */
export function setUsageSharing(on: boolean) {
  enabled = on;
}

export function track(name: EventName, props: Record<string, string | number | boolean> = {}) {
  if (!enabled) return;
  enqueue('analytics_events', { name, props, app_version: APP_VERSION, platform: PLATFORM, local_date: toDateKey() });
}

/** Called on launch and when the app returns to the foreground: counts at most one visit a day. */
export function countVisit() {
  const today = toDateKey();
  const s = read();
  if (!s) {
    write({ cohort: today, lastVisit: today });
    track('first_open', { cohort: today });
    track('daily_visit', { cohort: today, day: 0 });
    return;
  }
  if (s.lastVisit === today) return;
  write({ ...s, lastVisit: today });
  track('daily_visit', { cohort: s.cohort, day: daysBetween(s.cohort, today) });
}

export function countPuzzle(formatId: string, solved: boolean) {
  puzzlesThisVisit++;
  track('puzzle_complete', { format: formatId, solved });
}

/** Sent when the app goes to the background: how many puzzles this visit included. */
export function endVisit() {
  if (puzzlesThisVisit) track('visit_end', { puzzles: puzzlesThisVisit });
  puzzlesThisVisit = 0;
}

export function startAnalytics() {
  if (typeof document === 'undefined') return;
  countVisit();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') endVisit();
    else countVisit();
  });
}
