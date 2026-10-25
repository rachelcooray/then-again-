import { engineFor } from '../engines/registry';
import type { WordSearchPayload } from '../engines/letter-grid-search/logic';
import { addDays, daysBetween, weekdayIndex } from '../lib/date';
import { getDailySet } from './daily';
import { getFormat } from './formats';
import { getPuzzle } from './puzzles';
import { loadScheduleAround, scheduledDay, scheduleRange } from './schedule';

const LEVEL_BY_WEEKDAY = [1, 1, 2, 2, 3, 3, 2];
const NEEDS_WRITING = ['rewind', 'mini-crossword', 'quiz', 'higher-lower', 'mystery-object', 'put-in-order'];
const dates = Array.from({ length: daysBetween(scheduleRange.first, scheduleRange.last) + 1 }, (_, i) => addDays(scheduleRange.first, i));

beforeAll(async () => {
  for (const d of dates) await loadScheduleAround(d);
});

describe('generated calendar', () => {
  it('covers at least 60 days', () => {
    expect(dates.length).toBeGreaterThanOrEqual(60);
    for (const d of dates) expect(scheduledDay(d)).toBeDefined();
  });

  it('ramps difficulty from easy on Monday to hard on Saturday', () => {
    for (const d of dates) expect(getDailySet(d).level).toBe(LEVEL_BY_WEEKDAY[weekdayIndex(d)]);
  });

  it('gives each day four different formats that all have a puzzle that day', () => {
    for (const d of dates) {
      const { formats } = getDailySet(d);
      expect(new Set(formats).size).toBe(4);
      for (const f of formats) {
        expect(getFormat(f)).toBeDefined();
        expect(NEEDS_WRITING).not.toContain(f);
        expect(scheduledDay(d)!.puzzles[f]).toBeDefined();
      }
    }
  });

  it('doesn’t repeat a format in the day’s four on consecutive days, apart from the word search and the handwritten link week', () => {
    for (const d of dates.slice(1)) {
      if (getDailySet(d).link) continue;
      const yesterday = getDailySet(addDays(d, -1)).formats;
      for (const f of getDailySet(d).formats) if (f !== 'word-search') expect(yesterday, `${d} ${f}`).not.toContain(f);
    }
  });

  it('serves a new puzzle every day for generated formats, and the design puzzle for the rest', () => {
    const [a, b] = dates;
    expect(getPuzzle(a, 'sudoku')!.id).not.toBe(getPuzzle(b, 'sudoku')!.id);
    expect(getPuzzle(a, 'quiz')!.id).toBe(getPuzzle(b, 'quiz')!.id);
  });

  it('never puts the Word Guess answer in the same day’s word search', () => {
    for (const d of dates) {
      const answer = (getPuzzle(d, 'word-guess')!.payload as { answer: string }).answer;
      const search = getPuzzle(d, 'word-search')!.payload as WordSearchPayload;
      expect(search.words.map((w) => w.word)).not.toContain(answer);
    }
  });

  it('has seven handwritten link days, each with four clues that don’t give the link away', () => {
    const linkDays = dates.filter((d) => getDailySet(d).link);
    expect(linkDays).toEqual(['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01']);
    for (const d of linkDays) {
      const set = getDailySet(d);
      expect(set.link!.options).toHaveLength(4);
      expect(set.link!.options).toContain(set.link!.answer);
      const keys = set.formats.map((f) => getPuzzle(d, f)!.linkKey);
      expect(keys.every(Boolean), d).toBe(true);
      for (const k of keys) expect(k, d).not.toContain(set.link!.answer);
    }
  });

  it('never shows the link itself on a link day, in any puzzle or memory', () => {
    for (const d of dates.filter((x) => getDailySet(x).link)) {
      const answer = getDailySet(d).link!.answer;
      for (const p of Object.values(scheduledDay(d)!.puzzles)) {
        expect(`${p.memory.title ?? ''} ${p.memory.text}`, `${d} ${p.formatId} memory`).not.toMatch(new RegExp(`\\b${answer}`, 'i'));
      }
      for (const f of getDailySet(d).formats) {
        const p = getPuzzle(d, f)!.payload as { words?: { word: string }[]; rounds?: { answer: string }[]; answer?: string; targets?: string[] };
        const words = [...(p.words ?? []).map((w) => w.word), ...(p.rounds ?? []).map((x) => x.answer), ...(p.targets ?? []), p.answer ?? ''];
        for (const w of words) expect(w, `${d} ${f}`).not.toContain(answer);
      }
    }
  });

  it('puts each link clue where the player will find it', () => {
    for (const d of dates.filter((x) => getDailySet(x).link)) {
      for (const f of getDailySet(d).formats) {
        const p = getPuzzle(d, f)!;
        const text = JSON.stringify(p.payload).toUpperCase();
        expect(text, `${d} ${f}`).toContain(p.linkKey);
      }
    }
  });

  it('loads into its engine, unfinished, for every scheduled puzzle', () => {
    for (const d of dates) {
      for (const p of Object.values(scheduledDay(d)!.puzzles)) {
        const engine = engineFor(getFormat(p.formatId)!)!;
        const status = engine.status(engine.init(p.payload), p.payload);
        expect(status.done, p.id).toBe(false);
      }
    }
  });
});
