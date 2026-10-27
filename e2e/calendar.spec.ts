import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { FORMATS } from '../src/content/formats';
import { openDay } from '../src/content/schedule-codec';
import type { ScheduledDay } from '../src/content/schedule';
import type { WordSearchPayload } from '../src/engines/letter-grid-search/logic';
import type { LetterGuessPayload } from '../src/engines/letter-guess/logic';

/** The generated calendar, played through the real screens on fixed dates. */

const day = (date: string) =>
  openDay<ScheduledDay>(date, JSON.parse(readFileSync(new URL(`../src/content/generated/days/${date}.json`, import.meta.url), 'utf8')));
const nameOf = (id: string) => FORMATS.find((f) => f.id === id)!.name;

const SATURDAY = '2026-10-24';
const SUNDAY = '2026-10-25';

test.use({ viewport: { width: 390, height: 844 } });

const errors: string[] = [];
test.beforeEach(async ({ page }) => {
  errors.length = 0;
  page.on('pageerror', (e) => errors.push(e.message));
});
test.afterEach(() => expect(errors).toEqual([]));

async function on(page: Page, date: string, path = '/') {
  await page.clock.setFixedTime(new Date(`${date}T10:00:00`));
  await page.goto(`/#${path}`);
  await page.waitForLoadState('networkidle');
}

test('Today shows the generated day’s four and its difficulty', async ({ page }) => {
  const d = day(SATURDAY);
  await on(page, SATURDAY);
  await expect(page.locator('.today-level')).toContainText('Saturday · Hard');
  await expect(page.locator('.ticket__name')).toHaveText(nameOf(d.formats[0]));
  for (const id of d.formats.slice(1)) await expect(page.locator('.mosaic')).toContainText(nameOf(id));
});

test('the next day brings new puzzles and an easier level', async ({ page }) => {
  const [sat, sun] = [day(SATURDAY), day(SUNDAY)];
  expect((sat.puzzles['word-guess'].payload as LetterGuessPayload).answer).not.toBe((sun.puzzles['word-guess'].payload as LetterGuessPayload).answer);
  await on(page, SUNDAY);
  await expect(page.locator('.today-level')).toContainText('Sunday · Medium');
});

test('a generated Word Guess plays and saves', async ({ page }) => {
  const p = day(SATURDAY).puzzles['word-guess'].payload as LetterGuessPayload;
  await on(page, SATURDAY, '/play/word-guess');
  await expect(page.getByText('Loading the word list…')).toHaveCount(0);
  await expect(page.locator('.play .kicker').first()).toContainText('Hard');
  await page.keyboard.type(p.answer);
  await page.keyboard.press('Enter');
  await expect(page.locator('#result-title')).toBeVisible();
  await page.goto('/#/collection');
  await expect(page.locator('.collection-list')).toContainText('Word Guess');
});

test('a generated Word Search is solvable by tapping', async ({ page }) => {
  const p = day(SATURDAY).puzzles['word-search'].payload as WordSearchPayload;
  await on(page, SATURDAY, '/play/word-search');
  for (const w of p.words) {
    await page.locator('.ws-cell').nth(w.start).click();
    await page.locator('.ws-cell').nth(w.end).click();
  }
  await expect(page.locator('#result-title')).toBeVisible();
});

test('the Library shows today’s level on generated formats', async ({ page }) => {
  await on(page, SATURDAY, '/library');
  const sudoku = page.locator('.card', { has: page.locator('.card__name', { hasText: /^Sudoku$/ }) });
  await expect(sudoku).toContainText('Hard');
});

test.describe('hard-day boards at 320px with the largest text', () => {
  test.use({ viewport: { width: 320, height: 640 } });
  const DENSE = '.ws-cell, .ng-cell, .lg-key, .bn-cell, .lgd-cell, .ngm-cell, .ms-cell, .cw-cell';
  const hard = day(SATURDAY);

  test('every generated format fits and keeps its touch targets', async ({ page }) => {
    await page.addInitScript(() => {
      if (sessionStorage.getItem('seeded')) return;
      sessionStorage.setItem('seeded', '1');
      localStorage.setItem('then-again:v1', JSON.stringify({ version: 1, settings: { textSize: 'larger', appearance: 'light' }, plus: { source: 'preview', since: '2026-10-01T00:00:00Z' } }));
    });
    await page.clock.setFixedTime(new Date(`${SATURDAY}T10:00:00`));
    for (const id of Object.keys(hard.puzzles)) {
      await page.goto(`/#/play/${id}`);
      await page.waitForLoadState('networkidle');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${id} fits 320px`).toBeLessThanOrEqual(0);
      const small = await page
        .locator('button:visible, a.btn:visible, input:visible, summary:visible')
        .evaluateAll((els, dense) =>
          els
            .map((el) => ({ el, r: el.getBoundingClientRect(), d: el.matches(dense) }))
            .filter(({ r, d }) => (d ? r.height < 24 || r.width < 24 : r.height < 44 || r.width < 44))
            .map(({ el, r }) => `${el.className} "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 20)}" ${Math.round(r.width)}×${Math.round(r.height)}`),
          DENSE,
        );
      expect(small, `${id} touch targets`).toEqual([]);
    }
  });
});
