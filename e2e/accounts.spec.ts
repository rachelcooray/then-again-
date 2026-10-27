import { expect, test, type Page } from '@playwright/test';

/** Accounts and admin pages, in the preview they run in until Supabase is connected. */

test.use({ viewport: { width: 390, height: 844 } });

const errors: string[] = [];
test.beforeEach(async ({ page }) => {
  errors.length = 0;
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.clear();
    const r = { date: '2026-10-26', formatId: 'word-guess', themeId: 'x', issue: 26, solved: true, score: '3/6', completedAt: '2026-10-26T09:00:00Z' };
    localStorage.setItem('then-again:v1', JSON.stringify({ version: 1, settings: { textSize: 'standard', appearance: 'light', region: 'uk' }, progress: { '2026-10-26:word-guess': r } }));
  });
  await page.clock.setFixedTime(new Date('2026-10-26T10:00:00'));
});
test.afterEach(() => expect(errors).toEqual([]));

async function signIn(page: Page) {
  await page.goto('/#/account');
  await page.getByLabel('Email address').fill('ada@example.com');
  await page.getByRole('button', { name: 'Email me a code' }).click();
  await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible();
  await page.getByLabel('Your code').fill('123456');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.locator('.account-email')).toHaveText('ada@example.com');
}

test('signing in with an emailed code, saving, and signing out', async ({ page }) => {
  await page.goto('/#/collection');
  await page.getByRole('link', { name: 'Sign in' }).click();
  await expect(page.getByText('Accounts aren’t switched on yet')).toBeVisible();
  await expect(page.getByText('You have 1 result on this phone')).toBeVisible();

  // Mistakes are explained.
  await page.getByLabel('Email address').fill('not-an-email');
  await page.getByRole('button', { name: 'Email me a code' }).click();
  await expect(page.getByRole('alert')).toContainText('doesn’t look right');
  await page.getByLabel('Email address').fill('ada@example.com');
  await page.getByRole('button', { name: 'Email me a code' }).click();
  await expect(page.getByRole('button', { name: /New code in \d+s/ })).toBeDisabled();
  await page.getByLabel('Your code').fill('12');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('alert')).toContainText('six digits');
  await page.getByLabel('Your code').fill('123456');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.locator('.account-email')).toHaveText('ada@example.com');

  await page.getByRole('button', { name: 'Save now' }).click();
  await expect(page.getByText('Preview: nothing was sent.')).toBeVisible();

  // Still signed in after a reload; the collection says Account.
  await page.goto('/#/collection');
  await expect(page.getByRole('link', { name: 'Account', exact: true })).toBeVisible();

  await page.getByRole('link', { name: 'Account', exact: true }).click();
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByRole('button', { name: 'Email me a code' })).toBeVisible();
});

test('downloading your data and deleting your account', async ({ page }) => {
  await signIn(page);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download my data' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('then-again-my-data.json');

  await page.getByRole('button', { name: 'Delete my account' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete account' }).click();
  await expect(page.getByRole('button', { name: 'Email me a code' })).toBeVisible();
  await page.goto('/#/collection');
  await expect(page.getByText('Nothing solved yet')).toBeVisible();
});

test('admin: calendar, a day’s puzzles and reviewing one', async ({ page }) => {
  await page.goto('/#/admin');
  await expect(page.getByText('Scheduled through')).toBeVisible();
  await page.getByRole('link', { name: 'Calendar' }).click();
  await page.getByRole('link', { name: /MON 26 OCT/ }).click();
  await expect(page.getByText('Hidden link:')).toBeVisible();
  await expect(page.locator('.admin-puzzle').first()).toContainText('Link clue');

  const first = page.locator('.admin-puzzle').first();
  await first.getByText('Show the answer').click();
  await expect(first.locator('.admin-answer p')).toBeVisible();
  await expect(first.getByRole('button', { name: 'Needs changes' })).toBeDisabled();
  await first.getByRole('button', { name: 'Approve' }).click();
  await expect(first.locator('.admin-status')).toContainText('Approved');

  await page.getByRole('link', { name: 'Review' }).click();
  await page.getByRole('button', { name: /^Approved · 1$/ }).click();
  await expect(page.locator('.admin-puzzle')).toHaveCount(1);
});

test('admin: players, feedback and switches explain what needs the server', async ({ page }) => {
  await page.goto('/#/admin/players');
  await page.getByLabel('Player’s email').fill('ada@example.com');
  await page.getByRole('button', { name: 'Find player' }).click();
  await expect(page.getByText('Player search works once Supabase is connected.')).toBeVisible();
  await page.goto('/#/admin/feedback');
  await expect(page.getByText('appear here once Supabase is connected')).toBeVisible();
  await page.goto('/#/admin/switches');
  await page.getByRole('group', { name: 'Paused games' }).getByLabel('Sudoku', { exact: true }).check();
  await page.getByRole('button', { name: 'Save switches' }).click();
  await expect(page.getByText('Switches can be saved once Supabase is connected.')).toBeVisible();
});
