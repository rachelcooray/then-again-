import { expect, test } from '@playwright/test';

/** Five games free, the rest with Then Again Plus at $0.99 a month (a preview until payments are connected). */

test.use({ viewport: { width: 390, height: 844 } });

const errors: string[] = [];
test.beforeEach(async ({ page }) => {
  errors.length = 0;
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.clear();
    localStorage.setItem('then-again:v1', JSON.stringify({ version: 1, settings: { textSize: 'standard', appearance: 'light', region: 'uk' } }));
  });
  // A Saturday whose four are Word Search, Circle Word Finder, Sliding Tile and 4×4 Logic.
  await page.clock.setFixedTime(new Date('2026-10-24T10:00:00'));
});
test.afterEach(() => expect(errors).toEqual([]));

const card = (page: import('@playwright/test').Page, name: string) =>
  page.locator('.card', { has: page.locator('.card__name', { hasText: new RegExp(`^${name}$`) }) });

test('the Library marks the Plus games; free ones and today’s four stay open', async ({ page }) => {
  await page.goto('/#/library');
  await expect(page.getByText('5 free · 17 with Plus')).toBeVisible();
  await expect(card(page, 'Kakuro')).toContainText('Plus');
  await expect(card(page, 'Sudoku')).not.toContainText('Plus');
  // Sliding Tile is a Plus game, but it's in today's four.
  await expect(card(page, 'Sliding Tile')).not.toContainText('Plus');
  await page.goto('/#/play/sliding-tile');
  await expect(page.getByRole('group', { name: 'Sliding tiles' })).toBeVisible();
});

test('a Plus game offers Plus; starting the preview unlocks it, and ending it locks it again', async ({ page }) => {
  await page.goto('/#/play/kakuro');
  await expect(page.getByRole('heading', { name: 'Kakuro is part of Plus' })).toBeVisible();
  await expect(page.locator('.plus-price')).toContainText('$0.99 a month');
  await page.getByRole('button', { name: 'Restore purchases' }).click();
  await expect(page.getByText('Nothing to restore yet')).toBeVisible();
  await page.getByRole('button', { name: 'Get Plus for $0.99 a month' }).click();
  // The game opens straight away.
  await expect(page.getByRole('heading', { name: 'Kakuro is part of Plus' })).toHaveCount(0);
  await expect(page.locator('.play-rules')).toBeVisible();

  await page.goto('/#/library');
  await expect(card(page, 'Kakuro')).not.toContainText('Plus');
  await page.goto('/#/plus');
  await expect(page.getByText('Every game is unlocked')).toBeVisible();
  await page.getByRole('button', { name: 'End the preview' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'End preview' }).click();
  await expect(page.getByRole('button', { name: 'Get Plus for $0.99 a month' })).toBeVisible();
});
