import { config } from '../config';
import { daysBetween, weekdayIndex, type DateKey } from '../lib/date';
import { themeForDate, type Theme } from './themes';

export interface DailySet {
  date: DateKey;
  issue: number;
  theme: Theme;
  /** Format ids in play order; the first is the featured puzzle. */
  formats: string[];
}

export function issueNumber(date: DateKey): number {
  return daysBetween(config.issueEpoch, date) + 1;
}

/**
 * The daily set for a player's local date. Everyone on the same date gets the same set.
 * Until phase 3 this comes from the seed theme rotation; the featured puzzle moves through
 * the theme's four formats day by day.
 */
export function getDailySet(date: DateKey): DailySet {
  const theme = themeForDate(date);
  const shift = weekdayIndex(date) % theme.formats.length;
  const formats = [...theme.formats.slice(shift), ...theme.formats.slice(0, shift)];
  return { date, issue: issueNumber(date), theme, formats };
}
