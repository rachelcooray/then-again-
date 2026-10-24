import { addDays, compactDate, daysBetween, formatIssue, toDateKey, weekStart, weekdayIndex } from './date';

describe('date keys', () => {
  it('uses the local calendar date', () => {
    expect(toDateKey(new Date(2026, 9, 23, 23, 59))).toBe('2026-10-23');
    expect(toDateKey(new Date(2026, 9, 24, 0, 0))).toBe('2026-10-24');
  });

  it('steps across month, year and DST boundaries one day at a time', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-29', 1)).toBe('2026-03-30');
    expect(daysBetween('2026-10-01', '2026-10-23')).toBe(22);
  });

  it('knows the weekday and week start', () => {
    expect(weekdayIndex('2026-10-23')).toBe(4); // Friday
    expect(weekStart('2026-10-23')).toBe('2026-10-19');
    expect(weekStart('2026-10-19')).toBe('2026-10-19');
    expect(compactDate('2026-10-23')).toBe('FRI 23 OCT');
  });

  it('formats issue numbers', () => {
    expect(formatIssue(23)).toBe('Nº 023');
  });
});
