/** Local calendar dates are handled as YYYY-MM-DD keys so they never drift across time zones or DST. */
export type DateKey = string;

const pad = (n: number) => String(n).padStart(2, '0');

export function toDateKey(d: Date = new Date()): DateKey {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Days since the Unix epoch for a date key, using UTC so every day is exactly one step. */
function dayNumber(key: DateKey): number {
  const [y, m, d] = key.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

export function daysBetween(from: DateKey, to: DateKey): number {
  return dayNumber(to) - dayNumber(from);
}

export function addDays(key: DateKey, days: number): DateKey {
  const [y, m, d] = key.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

/** 0 = Monday ... 6 = Sunday. */
export function weekdayIndex(key: DateKey): number {
  return (dayNumber(key) + 3) % 7; // 1970-01-01 was a Thursday
}

export function weekStart(key: DateKey): DateKey {
  return addDays(key, -weekdayIndex(key));
}

export function formatIssue(n: number): string {
  return `Nº ${String(Math.max(n, 0)).padStart(3, '0')}`;
}

const WEEKDAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEKDAYS_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function longWeekday(key: DateKey): string {
  return WEEKDAYS_LONG[weekdayIndex(key)];
}

export function shortWeekday(key: DateKey): string {
  return WEEKDAYS_SHORT[weekdayIndex(key)];
}

/** "FRI 23 OCT" */
export function compactDate(key: DateKey): string {
  const [, m, d] = key.split('-').map(Number);
  return `${shortWeekday(key)} ${d} ${MONTHS_SHORT[m - 1]}`.toUpperCase();
}

/** "Friday 23 October" */
export function longDate(key: DateKey): string {
  const [, m, d] = key.split('-').map(Number);
  return `${WEEKDAYS_LONG[weekdayIndex(key)]} ${d} ${MONTHS_LONG[m - 1]}`;
}

/** Milliseconds until the next local midnight. */
export function msUntilMidnight(now: Date = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return next.getTime() - now.getTime();
}
