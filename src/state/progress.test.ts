import {
  addRecord,
  currentStreak,
  daysPlayedThisWeek,
  fullSetsCompleted,
  recordKey,
  solvedCount,
  type ProgressMap,
  type PuzzleRecord,
} from './progress';

const rec = (date: string, formatId: string, solved = true): PuzzleRecord => ({
  date, formatId, themeId: 'school-days', issue: 1, solved, score: solved ? '4/6' : 'X/6', completedAt: `${date}T10:00:00Z`,
});

const build = (...records: PuzzleRecord[]) => records.reduce<ProgressMap>(addRecord, {});

describe('progress', () => {
  it('keeps the first attempt and ignores later results for the same puzzle', () => {
    const first = build(rec('2026-10-23', 'word-guess', false));
    const again = addRecord(first, rec('2026-10-23', 'word-guess', true));
    expect(again).toBe(first);
    expect(again[recordKey('2026-10-23', 'word-guess')].solved).toBe(false);
  });

  it('counts a streak ending today or yesterday', () => {
    const p = build(rec('2026-10-21', 'sudoku'), rec('2026-10-22', 'sudoku'), rec('2026-10-23', 'sudoku'));
    expect(currentStreak(p, '2026-10-23')).toBe(3);
    expect(currentStreak(p, '2026-10-24')).toBe(3);
    expect(currentStreak(p, '2026-10-25')).toBe(0);
  });

  it('counts days played in the current Monday-to-Sunday week', () => {
    const p = build(rec('2026-10-18', 'sudoku'), rec('2026-10-19', 'sudoku'), rec('2026-10-19', 'rewind'), rec('2026-10-23', 'sudoku'));
    expect(daysPlayedThisWeek(p, '2026-10-23')).toBe(2);
  });

  it('counts solved puzzles and full sets', () => {
    const p = build(
      rec('2026-10-23', 'a'), rec('2026-10-23', 'b'), rec('2026-10-23', 'c'), rec('2026-10-23', 'd', false),
      rec('2026-10-24', 'a'),
    );
    expect(solvedCount(p)).toBe(4);
    expect(fullSetsCompleted(p, () => 4)).toBe(1);
  });
});
