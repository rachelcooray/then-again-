import { expect, test, type Page } from '@playwright/test';
import { canvasPuzzle } from '../src/content/canvas';
import type { CardPayload } from '../src/engines/card/logic';
import { earliestLine } from '../src/engines/card/logic';
import type { GroupingPayload } from '../src/engines/grouping';
import type { WordSearchPayload } from '../src/engines/letter-grid-search';
import type { LetterGuessPayload } from '../src/engines/letter-guess/logic';
import type { LetterSetPayload } from '../src/engines/letter-set';
import type { LogicGridPayload } from '../src/engines/logic-grid';
import type { NumberGridPayload } from '../src/engines/number-grid';

/** Phase 2 acceptance tests: each format can be won and lost, rules are enforced, results save, tap and keyboard both work. */

const payload = <P>(id: string) => canvasPuzzle(id)!.payload as P;
const wg = payload<LetterGuessPayload>('word-guess');
const ws = payload<WordSearchPayload>('word-search');
const su = payload<NumberGridPayload>('sudoku');
const rw = payload<GroupingPayload>('rewind');
const cw = payload<LetterSetPayload>('circle-word');
const bn = payload<CardPayload>('bingo');
const lg = payload<LogicGridPayload>('logic-grid');

test.use({ viewport: { width: 390, height: 844 } });

async function open(page: Page, id: string) {
  await page.goto(`/#/play/${id}`);
  await page.waitForLoadState('networkidle');
  await expect(page.getByText('Loading the word list…')).toHaveCount(0);
}

const message = (page: Page) => page.locator('.play-message');

async function confirm(page: Page, label: string, confirmLabel: string) {
  await page.getByRole('button', { name: label, exact: true }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: confirmLabel, exact: true }).click();
}

async function expectSaved(page: Page, name: string, score: RegExp) {
  await page.reload();
  await expect(page.locator('#result-title')).toBeVisible();
  await page.goto('/#/collection');
  await expect(page.locator('.collection-list')).toContainText(name);
  await expect(page.locator('.collection-list')).toContainText(score);
}

test.beforeEach(async ({ page }) => {
  // These tests play the design puzzles, whose answers they know, rather than the generated calendar.
  await page.addInitScript(() => localStorage.setItem('then-again:content', 'canvas'));
  // These tests play every game, so they have Plus.
  await page.addInitScript(() => {
    if (sessionStorage.getItem('plus-seeded')) return;
    sessionStorage.setItem('plus-seeded', '1');
    localStorage.setItem('then-again:v1', JSON.stringify({ version: 1, plus: { source: 'preview', since: '2026-10-01T00:00:00Z' } }));
  });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  (page as Page & { errors?: string[] }).errors = errors;
});

test.afterEach(async ({ page }) => {
  expect((page as Page & { errors?: string[] }).errors).toEqual([]);
});

test.describe('Word Guess', () => {
  test('won by typing on the keyboard; nonsense words are refused; the result saves', async ({ page }) => {
    await open(page, 'word-guess');
    await page.keyboard.type('QQQQQ');
    await page.keyboard.press('Enter');
    await expect(message(page)).toContainText('isn’t in our word list');
    for (let i = 0; i < 5; i++) await page.keyboard.press('Backspace');
    await page.keyboard.type('PLANT');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('img', { name: 'A, right place' }).first()).toBeVisible();
    await page.keyboard.type(wg.answer);
    await page.keyboard.press('Enter');
    await expect(page.locator('#result-title')).toHaveText('Solved in 2!');
    await expect(page.getByRole('link', { name: /Next:/ })).toBeVisible();
    await expectSaved(page, 'Word Guess', /2\/6/);
  });

  test('lost after six wrong guesses, played by tapping', async ({ page }) => {
    await open(page, 'word-guess');
    for (const w of ['PLANT', 'BRICK', 'STONE', 'MOUSE', 'TRAIN', 'GHOST']) {
      for (const ch of w) await page.getByRole('button', { name: new RegExp(`^${ch}(,|$)`) }).click();
      await page.getByRole('button', { name: 'Enter' }).click();
    }
    await expect(page.locator('#result-title')).toHaveText('So close.');
    await expect(message(page)).toContainText(`The word was ${wg.answer}`);
  });
});

test.describe('Word Search', () => {
  const cell = (page: Page, i: number) => page.locator('.ws-cell').nth(i);

  test('won by tapping first and last letters', async ({ page }) => {
    await open(page, 'word-search');
    await cell(page, 0).click();
    await cell(page, 1).click();
    await expect(message(page)).toContainText('not one of the words');
    for (const w of ws.words) {
      await cell(page, w.start).click();
      await cell(page, w.end).click();
    }
    await expect(page.locator('#result-title')).toBeVisible();
    await expectSaved(page, 'Word Search', /6\/6/);
  });

  test('won with the keyboard only', async ({ page }) => {
    await open(page, 'word-search');
    await cell(page, 0).focus();
    const goTo = async (from: number, to: number) => {
      const [r0, c0, r1, c1] = [Math.floor(from / ws.cols), from % ws.cols, Math.floor(to / ws.cols), to % ws.cols];
      for (let k = 0; k < Math.abs(r1 - r0); k++) await page.keyboard.press(r1 > r0 ? 'ArrowDown' : 'ArrowUp');
      for (let k = 0; k < Math.abs(c1 - c0); k++) await page.keyboard.press(c1 > c0 ? 'ArrowRight' : 'ArrowLeft');
    };
    let at = 0;
    for (const w of ws.words) {
      await goTo(at, w.start);
      await page.keyboard.press('Enter');
      await goTo(w.start, w.end);
      await page.keyboard.press('Enter');
      at = w.end;
    }
    await expect(page.locator('#result-title')).toBeVisible();
  });

  test('lost by showing the answers', async ({ page }) => {
    await open(page, 'word-search');
    await confirm(page, 'Show the answers', 'Show answers');
    await expect(page.locator('.result')).toContainText('Today’s answer');
  });
});

test.describe('Sudoku', () => {
  const sol = su.solution.split('').map(Number);
  const empties = su.givens.split('').map((g, i) => (g === '0' ? i : -1)).filter((i) => i >= 0);

  test('wrong numbers are underlined; won with the keyboard', async ({ page }) => {
    await open(page, 'sudoku');
    const first = empties[0];
    await page.locator('.ng-cell').nth(first).click();
    await page.keyboard.press(String((sol[first] % 9) + 1));
    await page.getByRole('button', { name: 'Check my grid' }).click();
    await expect(page.locator('.ng-cell.is-wrong')).toHaveCount(1);
    await expect(page.locator('.ng-cell').nth(first)).toHaveAttribute('aria-label', /incorrect/);
    await page.locator('.ng-cell').nth(first).focus();

    let at = first;
    for (const i of empties) {
      const [r0, c0, r1, c1] = [Math.floor(at / 9), at % 9, Math.floor(i / 9), i % 9];
      for (let k = 0; k < Math.abs(r1 - r0); k++) await page.keyboard.press(r1 > r0 ? 'ArrowDown' : 'ArrowUp');
      for (let k = 0; k < Math.abs(c1 - c0); k++) await page.keyboard.press(c1 > c0 ? 'ArrowRight' : 'ArrowLeft');
      await page.keyboard.press(String(sol[i]));
      at = i;
    }
    await expect(page.locator('#result-title')).toHaveText('Every number in its place.');
    await expectSaved(page, 'Sudoku', /Solved/);
  });

  test('won by tapping, and givens can’t be changed', async ({ page }) => {
    await open(page, 'sudoku');
    const given = su.givens.split('').findIndex((g) => g !== '0');
    await page.locator('.ng-cell').nth(given).click();
    await page.getByRole('button', { name: 'Enter 9' }).click();
    await expect(message(page)).toContainText('part of the puzzle');
    for (const i of empties) {
      await page.locator('.ng-cell').nth(i).click();
      await page.getByRole('button', { name: `Enter ${sol[i]}` }).click();
    }
    await expect(page.locator('#result-title')).toBeVisible();
  });

  test('lost by showing the answers', async ({ page }) => {
    await open(page, 'sudoku');
    await confirm(page, 'Show the answers', 'Show answers');
    await expect(page.locator('#result-title')).toHaveText('Not this time.');
  });
});

test.describe('Rewind', () => {
  const pick = async (page: Page, items: string[]) => {
    for (const it of items) await page.getByRole('button', { name: new RegExp(`^(✓ )?${it}$`) }).click();
    await page.getByRole('button', { name: 'Check group' }).click();
  };

  test('won by tapping', async ({ page }) => {
    await open(page, 'rewind');
    for (const g of rw.groups) await pick(page, g.items);
    await expect(page.locator('#result-title')).toBeVisible();
    await expectSaved(page, 'Rewind', /0 mistakes/);
  });

  test('“one away”, then lost after four mistakes, played with the keyboard', async ({ page }) => {
    await open(page, 'rewind');
    const wrong = [...rw.groups[0].items.slice(0, 3), rw.groups[1].items[0]];
    for (let round = 0; round < 4; round++) {
      for (const it of wrong) {
        await page.getByRole('button', { name: new RegExp(`^(✓ )?${it}$`) }).focus();
        await page.keyboard.press('Enter');
      }
      await page.getByRole('button', { name: 'Check group' }).focus();
      await page.keyboard.press('Enter');
      if (round === 0) await expect(message(page)).toContainText('One away');
      if (round < 3) {
        await page.getByRole('button', { name: 'Clear' }).focus();
        await page.keyboard.press('Enter');
      }
    }
    await expect(page.locator('#result-title')).toHaveText('Out of tries.');
    await expect(page.locator('.gr-group.is-missed')).toHaveCount(4);
  });
});

test.describe('Circle Word Finder', () => {
  test('won by typing; bonus and made-up words handled', async ({ page }) => {
    await open(page, 'circle-word');
    for (const w of ['PINE', 'PLIC']) {
      await page.keyboard.type(w);
      await page.keyboard.press('Enter');
    }
    await expect(message(page)).toContainText('isn’t in today’s word list');
    await expect(page.locator('.ls-slots')).toContainText('+1 bonus');
    for (const w of cw.targets) {
      await page.keyboard.type(w);
      await page.keyboard.press('Enter');
    }
    await expect(page.locator('#result-title')).toBeVisible();
    await expectSaved(page, 'Circle Word Finder', /8\/8/);
  });

  test('played by tapping, then lost by showing the answers', async ({ page }) => {
    await open(page, 'circle-word');
    for (const ch of 'SNIP') await page.locator('.ls-letter', { hasText: ch }).click();
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.locator('.ls-slots li.is-found')).toHaveCount(1);
    await confirm(page, 'Show the answers', 'Show answers');
    await expect(page.locator('.result')).toContainText('1 of 8 found');
  });
});

test.describe('Daily Bingo', () => {
  test('won by calling and marking', async ({ page }) => {
    await open(page, 'bingo');
    await page.getByRole('button', { name: /^Kettle/ }).click();
    await expect(message(page)).toContainText('hasn’t been called');
    const n = earliestLine(bn);
    for (let k = 0; k < n; k++) {
      await page.getByRole('button', { name: 'Call next' }).click();
      const item = bn.calls[k];
      if (bn.card.includes(item)) await page.locator('.bn-cell', { hasText: new RegExp(`^${item}$`) }).click();
    }
    await expect(message(page)).toContainText(`A full line after ${n} calls`);
    await expect(page.locator('#result-title')).toHaveText(canvasPuzzle('bingo')!.memory.title!);
    await expectSaved(page, 'Daily Bingo', new RegExp(`${n} calls`));
  });

  test('lost by running out of calls, played with the keyboard', async ({ page }) => {
    await open(page, 'bingo');
    for (let k = 0; k < bn.maxCalls; k++) {
      await page.getByRole('button', { name: 'Call next' }).focus();
      await page.keyboard.press('Enter');
    }
    await page.getByRole('button', { name: 'Finish game' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#result-title')).toHaveText('No line this time.');
  });
});

test.describe('4×4 Logic', () => {
  const cell = (page: Page, r: number, c: number) => page.locator('.lgd-cell').nth(r * lg.cols.length + c);

  test('a wrong answer is caught, then won by tapping', async ({ page }) => {
    await open(page, 'logic-grid');
    const wrong = [lg.answer[1], lg.answer[0], lg.answer[2], lg.answer[3]];
    for (const [r, c] of wrong.entries()) await cell(page, r, c).click();
    await page.getByRole('button', { name: 'Check my answer' }).click();
    await expect(message(page)).toContainText('2 of 4 are right');
    for (const [r, c] of wrong.entries()) {
      await cell(page, r, c).click();
      await cell(page, r, c).click();
    }
    for (const [r, c] of lg.answer.entries()) await cell(page, r, c).click();
    await page.getByRole('button', { name: 'Check my answer' }).click();
    await expect(page.locator('#result-title')).toBeVisible();
    await expectSaved(page, '4×4 Logic', /check/);
  });

  test('played with the keyboard, then lost by showing the answers', async ({ page }) => {
    await open(page, 'logic-grid');
    await cell(page, 0, 0).focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    await expect(cell(page, 0, 1)).toHaveAttribute('aria-label', /, yes$/);
    await confirm(page, 'Show the answers', 'Show answers');
    await expect(page.locator('#result-title')).toHaveText('Not this time.');
  });
});

test('the daily run goes from one puzzle to the next unfinished one', async ({ page }) => {
  await open(page, 'word-search');
  await confirm(page, 'Show the answers', 'Show answers');
  const next = page.getByRole('link', { name: /^Next:/ });
  await expect(next).toBeVisible();
  await next.click();
  await expect(page).toHaveURL(/#\/play\//);
  await expect(page).not.toHaveURL(/word-search/);
});

test('a half-finished puzzle is still there after leaving and coming back', async ({ page }) => {
  await open(page, 'word-search');
  await page.locator('.ws-cell').nth(ws.words[0].start).click();
  await page.locator('.ws-cell').nth(ws.words[0].end).click();
  await page.goto('/#/');
  await open(page, 'word-search');
  await expect(page.locator('.ws-words li.is-found')).toHaveCount(1);
});

test('practice rounds after finishing don’t change the first result', async ({ page }) => {
  await open(page, 'word-guess');
  for (const w of ['PLANT', 'BRICK', 'STONE', 'MOUSE', 'TRAIN', 'GHOST']) {
    await page.keyboard.type(w);
    await page.keyboard.press('Enter');
  }
  await page.getByRole('button', { name: 'Play again' }).click();
  await expect(page.getByText('Practice round')).toBeVisible();
  await page.keyboard.type(wg.answer);
  await page.keyboard.press('Enter');
  await page.goto('/#/collection');
  await expect(page.locator('.collection-list')).toContainText('X/6');
});

