import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { openDay } from '../src/content/schedule-codec';
import type { ScheduledDay } from '../src/content/schedule';
import type { LetterGuessPayload } from '../src/engines/letter-guess/logic';

/** Steps 3 and 4: the hidden link, the end of the day, and the player's own memories. */

const LINK_DAY = '2026-10-26';
const day = openDay<ScheduledDay>(LINK_DAY, JSON.parse(readFileSync(new URL(`../src/content/generated/days/${LINK_DAY}.json`, import.meta.url), 'utf8')));

test.use({ viewport: { width: 390, height: 844 } });

const errors: string[] = [];
test.beforeEach(async ({ page }) => {
  errors.length = 0;
  page.on('pageerror', (e) => errors.push(e.message));
});
test.afterEach(() => expect(errors).toEqual([]));

/** Starts on the link day with every puzzle in the four done except Word Guess. */
async function almostDone(page: Page, region?: string, appearance = 'light') {
  const progress = Object.fromEntries(
    day.formats
      .filter((f) => f !== 'word-guess')
      .map((f) => [`${LINK_DAY}:${f}`, { date: LINK_DAY, formatId: f, themeId: day.themeId, issue: 26, solved: true, score: 'Done', completedAt: `${LINK_DAY}T09:00:00Z`, inSet: true }]),
  );
  await page.addInitScript(([p, r, a]) => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem('then-again:v1', JSON.stringify({ version: 1, settings: { textSize: 'larger', appearance: a, ...(r ? { region: r } : {}) }, progress: p }));
  }, [progress, region, appearance] as const);
  await page.clock.setFixedTime(new Date(`${LINK_DAY}T10:00:00`));
}

test('Today shows the hidden link and the clues found so far', async ({ page }) => {
  await almostDone(page, 'uk');
  await page.goto('/#/');
  const card = page.locator('.today-day');
  await expect(card).toContainText('Each puzzle hides a clue');
  for (const f of day.formats.filter((x) => x !== 'word-guess')) await expect(card).toContainText(day.puzzles[f].linkKey!);
});

test('finishing the four reveals the last clue, then the link can be guessed and the day shared', async ({ page }) => {
  await almostDone(page, 'uk');
  const wg = day.puzzles['word-guess'];
  await page.goto('/#/play/word-guess');
  await expect(page.getByText('Loading the word list…')).toHaveCount(0);
  await page.keyboard.type((wg.payload as LetterGuessPayload).answer);
  await page.keyboard.press('Enter');
  await expect(page.locator('.result__link')).toContainText(wg.linkKey!);

  await page.getByRole('link', { name: /Find today’s link/ }).click();
  await expect(page.getByRole('heading', { name: 'What links them?' })).toBeVisible();
  const wrong = day.link!.options.find((o) => o !== day.link!.answer)!;
  await page.getByRole('button', { name: wrong, exact: true }).click();
  await expect(page.locator('.day-link__result')).toContainText(`Not ${wrong}`);
  await expect(page.getByText('One try left.')).toBeVisible();
  await page.getByRole('button', { name: day.link!.answer, exact: true }).click();
  await expect(page.getByRole('heading', { name: 'You found the link' })).toBeVisible();
  await expect(page.locator('.day-link__result')).toContainText(day.link!.explain);

  await expect(page.locator('.day-share')).toContainText('🔗 Link found on the second try');
  await expect(page.locator('.day-share')).not.toContainText(day.link!.answer);
  await expect(page.locator('.day-tomorrow')).toContainText('Tomorrow · Tuesday · Easy');
  await expect(page.locator('.day-tomorrow')).toContainText('Another hidden link');

  // The guess is kept.
  await page.reload();
  await expect(page.getByRole('heading', { name: 'You found the link' })).toBeVisible();
});

test('“Did you have one?” and “Save this story” keep the memory with the player’s own words', async ({ page }) => {
  await almostDone(page, 'uk');
  const wg = day.puzzles['word-guess'];
  await page.goto('/#/play/word-guess');
  await expect(page.getByText('Loading the word list…')).toHaveCount(0);
  await page.keyboard.type((wg.payload as LetterGuessPayload).answer);
  await page.keyboard.press('Enter');

  await page.locator('.memory-panel').getByRole('button', { name: 'Yes' }).click();
  await expect(page.locator('.memory-panel')).toContainText('You said yes.');
  await page.getByRole('button', { name: 'Save this story' }).click();
  await page.getByRole('link', { name: /Saved to My memories/ }).click();

  const item = page.locator('.memory-item').first();
  await expect(item).toContainText(wg.memory.text);
  await item.getByLabel('Your own memory').fill('Mum kept ours in the bread bin.');
  await item.getByRole('button', { name: 'Save' }).click();
  await expect(item).toContainText('Saved on this phone.');
  await page.reload();
  await expect(page.locator('.memory-item').first().getByLabel('Your own memory')).toHaveValue('Mum kept ours in the bread bin.');
});

test('the UK or US question is asked once and can be changed in Settings', async ({ page }) => {
  await almostDone(page);
  await page.goto('/#/');
  await page.getByRole('button', { name: 'The US' }).click();
  await expect(page.getByRole('heading', { name: 'Where did you grow up?' })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Where did you grow up?' })).toHaveCount(0);
  await page.goto('/#/settings');
  await expect(page.getByRole('radio', { name: 'The US' })).toHaveAttribute('aria-checked', 'true');
});

for (const appearance of ['light', 'dark']) {
  test(`the day screen meets WCAG 2.2 AA and fits 320px, ${appearance}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    const all = Object.fromEntries(day.formats.map((f) => [`${LINK_DAY}:${f}`, { date: LINK_DAY, formatId: f, themeId: day.themeId, issue: 26, solved: true, score: 'Done', completedAt: '', inSet: true }]));
    await page.addInitScript(([p, a]) => {
      localStorage.setItem('then-again:v1', JSON.stringify({ version: 1, settings: { textSize: 'larger', appearance: a, region: 'uk' }, progress: p }));
    }, [all, appearance] as const);
    await page.clock.setFixedTime(new Date(`${LINK_DAY}T10:00:00`));
    for (const stage of ['guessing', 'revealed']) {
      await page.goto('/#/day');
      await expect(page.locator('.day-link')).toBeVisible();
      if (stage === 'revealed') {
        for (const o of day.link!.options.filter((x) => x !== day.link!.answer).slice(0, 2)) await page.getByRole('button', { name: o, exact: true }).click();
        await expect(page.locator('.day-link__result')).toContainText(day.link!.explain);
      }
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, stage).toBeLessThanOrEqual(0);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`), stage).toEqual([]);
    }
  });
}
