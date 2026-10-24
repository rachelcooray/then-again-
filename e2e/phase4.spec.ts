import { expect, test, type Page } from '@playwright/test';
import { getPuzzle } from '../src/content/puzzles';
import type { CrosswordPayload } from '../src/engines/crossword/logic';
import type { HiddenCellsPayload } from '../src/engines/hidden-cells/logic';
import type { AnagramsPayload } from '../src/engines/letter-set/anagrams';
import type { WordHivePayload } from '../src/engines/letter-set/word-hive';
import type { NumberGridPayload } from '../src/engines/number-grid';
import type { PictureLogicPayload } from '../src/engines/picture-logic/logic';
import type { HigherLowerPayload, MysteryPayload, OrderPayload, QuizPayload } from '../src/engines/quiz';
import type { SumGridPayload } from '../src/engines/sum-grid/logic';
import type { WordChainPayload } from '../src/engines/word-chain/logic';

/** Phase 4 acceptance tests: the other 15 formats, each won and lost through the real screen, by tap and by keyboard. */

const payload = <P>(id: string) => getPuzzle('', id)!.payload as P;

test.use({ viewport: { width: 390, height: 844 } });

const errors: string[] = [];
test.beforeEach(async ({ page }) => {
  errors.length = 0;
  page.on('pageerror', (e) => errors.push(e.message));
});
test.afterEach(() => expect(errors).toEqual([]));

async function open(page: Page, id: string) {
  await page.goto(`/#/play/${id}`);
  await page.waitForLoadState('networkidle');
  await expect(page.getByText('Loading the word list…')).toHaveCount(0);
}

const title = (page: Page) => page.locator('#result-title');
const message = (page: Page) => page.locator('.play-message');

async function giveUp(page: Page) {
  await page.getByRole('button', { name: 'Show the answers', exact: true }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Show answers' }).click();
  await expect(page.locator('.result')).toContainText('Today’s answer');
}

async function saved(page: Page, name: string) {
  await page.reload();
  await expect(title(page)).toBeVisible();
  await page.goto('/#/collection');
  await expect(page.locator('.collection-list')).toContainText(name);
}

/** Moves keyboard focus around a grid from one index to another with the arrow keys. */
async function arrowTo(page: Page, from: number, to: number, cols: number) {
  const [r0, c0, r1, c1] = [Math.floor(from / cols), from % cols, Math.floor(to / cols), to % cols];
  for (let k = 0; k < Math.abs(r1 - r0); k++) await page.keyboard.press(r1 > r0 ? 'ArrowDown' : 'ArrowUp');
  for (let k = 0; k < Math.abs(c1 - c0); k++) await page.keyboard.press(c1 > c0 ? 'ArrowRight' : 'ArrowLeft');
}

for (const [id, name] of [['mini-sudoku', 'Mini Sudoku'], ['killer-sudoku', 'Killer Sudoku'], ['futoshiki', 'Futoshiki']] as const) {
  test.describe(name, () => {
    const p = payload<NumberGridPayload>(id);
    const empties = p.givens.split('').map((g, i) => (g === '0' ? i : -1)).filter((i) => i >= 0);

    test('won with the keyboard, and the result saves', async ({ page }) => {
      await open(page, id);
      await page.locator('.ng-cell').nth(empties[0]).click();
      let at = empties[0];
      for (const i of empties) {
        await arrowTo(page, at, i, p.size);
        await page.keyboard.press(p.solution[i]);
        at = i;
      }
      await expect(title(page)).toBeVisible();
      await saved(page, name);
    });

    test('a rule break is flagged straight away; lost by showing the answers', async ({ page }) => {
      await open(page, id);
      const [a, b] = [empties[0], empties.find((i) => Math.floor(i / p.size) === Math.floor(empties[0] / p.size) && i !== empties[0])!];
      await page.locator('.ng-cell').nth(a).click();
      await page.getByRole('button', { name: 'Enter 1' }).click();
      await page.locator('.ng-cell').nth(b).click();
      await page.getByRole('button', { name: 'Enter 1' }).click();
      await expect(page.locator('.ng-cell.is-wrong').first()).toBeVisible();
      await expect(page.locator('.ng-cell').nth(b)).toHaveAttribute('aria-label', /breaks a rule/);
      await giveUp(page);
    });
  });
}

test.describe('Kakuro', () => {
  const p = payload<SumGridPayload>('kakuro');
  const whites = p.solution.split('').map((ch, i) => (ch === '#' ? -1 : i)).filter((i) => i >= 0);
  test('won by tapping; lost by showing the answers', async ({ page }) => {
    await open(page, 'kakuro');
    for (const i of whites) {
      await page.locator('.kk-grid > *').nth(i).click();
      await page.getByRole('button', { name: `Enter ${p.solution[i]}` }).click();
    }
    await expect(title(page)).toBeVisible();
    await saved(page, 'Kakuro');
  });
  test('arrow keys skip black squares; lost by showing the answers', async ({ page }) => {
    await open(page, 'kakuro');
    await page.locator('.kk-grid > *').nth(whites[0]).click();
    await page.keyboard.press('7');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('8');
    await expect(page.locator('.kk-grid > *').nth(whites[3])).toHaveText('8');
    await giveUp(page);
  });
});

test.describe('Nonogram', () => {
  const p = payload<PictureLogicPayload>('nonogram');
  test('won with the keyboard', async ({ page }) => {
    await open(page, 'nonogram');
    await page.locator('.ngm-cell').first().focus();
    let at = 0;
    for (const [i, b] of p.solution.split('').entries()) {
      if (b !== '1') continue;
      await arrowTo(page, at, i, p.cols);
      await page.keyboard.press('Enter');
      at = i;
    }
    await expect(title(page)).toBeVisible();
    await saved(page, 'Nonogram');
  });
  test('mark mode puts ×; lost by showing the answers', async ({ page }) => {
    await open(page, 'nonogram');
    await page.getByRole('radio', { name: /Mark empty/ }).click();
    await page.locator('.ngm-cell').first().click();
    await expect(page.locator('.ngm-cell').first()).toHaveAttribute('aria-label', /marked empty/);
    await giveUp(page);
  });
});

test.describe('Minesweeper', () => {
  const p = payload<HiddenCellsPayload>('minesweeper');
  const safe = Array.from({ length: p.rows * p.cols }, (_, i) => i).filter((i) => !p.mines.includes(i));
  test('won by uncovering every safe square', async ({ page }) => {
    await open(page, 'minesweeper');
    for (const i of safe) {
      const cell = page.locator('.ms-cell').nth(i);
      if (await cell.isDisabled()) break;
      if (!(await cell.getAttribute('class'))!.includes('is-open')) await cell.click();
    }
    await expect(title(page)).toHaveText(/Field cleared/);
    await saved(page, 'Minesweeper');
  });
  test('flagging by keyboard, then lost on a mine', async ({ page }) => {
    await open(page, 'minesweeper');
    await page.getByRole('radio', { name: /Flag/ }).click();
    await page.locator('.ms-cell').nth(p.start).focus();
    await arrowTo(page, p.start, p.mines[0], p.cols);
    await page.keyboard.press('Enter');
    await expect(page.locator('.ms-cell').nth(p.mines[0])).toHaveAttribute('aria-label', /flagged/);
    await page.getByRole('radio', { name: 'Uncover' }).click();
    await page.locator('.ms-cell').nth(p.mines[1]).click();
    await expect(title(page)).toHaveText(/Boom/);
  });
});

test.describe('Sliding Tile', () => {
  test('won by tapping; tiles away from the gap don’t move', async ({ page }) => {
    await open(page, 'sliding-tile');
    await page.getByRole('button', { name: /^Tile 1/ }).click();
    await expect(message(page)).toContainText('isn’t next to the gap');
    for (const t of [6, 8, 5, 6]) await page.getByRole('button', { name: new RegExp(`^Tile ${t}`) }).click();
    await expect(title(page)).toBeVisible();
    await saved(page, 'Sliding Tile');
  });
  test('played with the keyboard, then lost by showing the answers', async ({ page }) => {
    await open(page, 'sliding-tile');
    await page.getByRole('button', { name: /^Tile 6/ }).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.play-progress')).toHaveText('1 MOVES');
    await giveUp(page);
  });
});

test.describe('Mini Crossword', () => {
  const p = payload<CrosswordPayload>('mini-crossword');
  test('won by typing, with a wrong letter caught first', async ({ page }) => {
    await open(page, 'mini-crossword');
    await page.keyboard.type('X');
    await page.getByRole('button', { name: 'Check letters' }).click();
    await expect(page.locator('.cw-cell.is-wrong')).toHaveCount(1);
    await page.locator('.cw-cell').first().focus();
    for (let r = 0; r < 4; r++) {
      await page.locator('.cw-cell').nth(r * 4).click();
      await page.keyboard.type(p.solution.slice(r * 4, r * 4 + 4));
    }
    await expect(title(page)).toBeVisible();
    await saved(page, 'Mini Crossword');
  });
  test('typed by tapping the on-screen keys, then lost by showing the answers', async ({ page }) => {
    await open(page, 'mini-crossword');
    await page.locator('.lg-key', { hasText: /^B$/ }).click();
    await expect(page.locator('.cw-cell').first()).toContainText('B');
    await giveUp(page);
  });
});

test.describe('Word Ladder', () => {
  const p = payload<WordChainPayload>('word-ladder');
  test('won by typing words; bad steps are refused', async ({ page }) => {
    await open(page, 'word-ladder');
    const box = page.getByLabel('Next word');
    await box.fill('WARM');
    await box.press('Enter');
    await expect(message(page)).toContainText('exactly one letter');
    for (const w of p.route.slice(1)) {
      await box.fill(w);
      await box.press('Enter');
    }
    await expect(title(page)).toBeVisible();
    await saved(page, 'Word Ladder');
  });
  test('lost by showing the answers', async ({ page }) => {
    await open(page, 'word-ladder');
    await giveUp(page);
    await expect(page.locator('.wl-rungs li')).toHaveCount(p.route.length);
  });
});

test.describe('Anagrams', () => {
  const p = payload<AnagramsPayload>('anagrams');
  test('won by typing', async ({ page }) => {
    await open(page, 'anagrams');
    for (const r of p.rounds) {
      await page.keyboard.type(r.answer);
      await page.keyboard.press('Enter');
    }
    await expect(page.locator('.result')).toContainText('A little piece of the past');
    await expect(page.locator('.an-results li.is-right')).toHaveCount(p.rounds.length);
    await saved(page, 'Anagrams');
  });
  test('tapping letters works; lost by skipping', async ({ page }) => {
    await open(page, 'anagrams');
    await page.locator('.an-tile').first().click();
    await expect(page.locator('.ls-word')).toHaveText(p.rounds[0].letters[0]);
    for (let k = 0; k < p.rounds.length; k++) await page.getByRole('button', { name: 'Skip' }).click();
    await expect(page.locator('.result')).toContainText('Today’s answer');
  });
});

test.describe('Word Hive', () => {
  const p = payload<WordHivePayload>('word-hive');
  test('won by typing words, then finishing', async ({ page }) => {
    await open(page, 'word-hive');
    await page.keyboard.type('PEST');
    await page.keyboard.press('Enter');
    await expect(message(page)).toContainText('centre');
    for (const w of p.words.slice(0, p.goal)) {
      await page.keyboard.type(w);
      await page.keyboard.press('Enter');
    }
    await page.getByRole('button', { name: /I’m finished/ }).click();
    await expect(page.locator('.result')).toContainText('A little piece of the past');
    await saved(page, 'Word Hive');
  });
  test('tapping the hive works; lost by finishing below the goal', async ({ page }) => {
    await open(page, 'word-hive');
    for (const ch of 'CAPE') await page.locator('.wh-cell', { hasText: new RegExp(`^${ch}$`) }).click();
    await page.getByRole('button', { name: 'Enter', exact: true }).click();
    await page.getByRole('button', { name: /I’m finished/ }).click();
    await expect(page.locator('.result')).toContainText('Today’s answer');
  });
});

test.describe('The Quiz', () => {
  const p = payload<QuizPayload>('quiz');
  const run = async (page: Page, pick: (i: number) => number) => {
    for (const [i, q] of p.questions.entries()) {
      await page.getByRole('button', { name: q.options[pick(i)], exact: true }).click();
      await page.getByRole('button', { name: /Next question|See my score/ }).click();
    }
  };
  test('won', async ({ page }) => {
    await open(page, 'quiz');
    await run(page, (i) => p.questions[i].answer);
    await expect(title(page)).toHaveText(/./);
    await expect(page.locator('.result')).toContainText('A little piece of the past');
    await saved(page, 'The Quiz');
  });
  test('lost, played with the keyboard', async ({ page }) => {
    await open(page, 'quiz');
    for (const q of p.questions) {
      await page.getByRole('button', { name: q.options[(q.answer + 1) % 4], exact: true }).focus();
      await page.keyboard.press('Enter');
      await page.getByRole('button', { name: /Next question|See my score/ }).focus();
      await page.keyboard.press('Enter');
    }
    await expect(page.locator('.result')).toContainText('Today’s answer');
  });
});

test.describe('Higher or Lower', () => {
  const p = payload<HigherLowerPayload>('higher-lower');
  const run = async (page: Page, right: boolean) => {
    for (const [i, it] of p.items.slice(1).entries()) {
      const higher = (it.value > p.items[i].value) === right;
      await page.getByRole('button', { name: higher ? /Higher/ : /Lower/ }).click();
      await page.getByRole('button', { name: /^Next|See my score/ }).click();
    }
  };
  test('won', async ({ page }) => {
    await open(page, 'higher-lower');
    await run(page, true);
    await expect(title(page)).toBeVisible();
    await saved(page, 'Higher or Lower');
  });
  test('lost', async ({ page }) => {
    await open(page, 'higher-lower');
    await run(page, false);
    await expect(page.locator('.result')).toContainText('Today’s answer');
  });
});

test.describe('Mystery Object', () => {
  const p = payload<MysteryPayload>('mystery-object');
  test('a clue can be revealed, then won', async ({ page }) => {
    await open(page, 'mystery-object');
    await page.getByRole('button', { name: /Show another clue/ }).click();
    await expect(page.locator('.mo-clues li:not(.is-hidden)')).toHaveCount(2);
    await page.getByRole('button', { name: p.answer, exact: true }).click();
    await expect(title(page)).toBeVisible();
    await saved(page, 'Mystery Object');
  });
  test('lost after three wrong guesses, played with the keyboard', async ({ page }) => {
    await open(page, 'mystery-object');
    for (const o of p.options.filter((x) => x !== p.answer)) {
      await page.getByRole('button', { name: o, exact: true }).focus();
      await page.keyboard.press('Enter');
    }
    await expect(page.locator('.result')).toContainText('Today’s answer');
  });
});

test.describe('Put It in Order', () => {
  const p = payload<OrderPayload>('put-in-order');
  test('won by moving steps with the arrows', async ({ page }) => {
    await open(page, 'put-in-order');
    // Selection sort: bring each step to its place from the top.
    for (let target = 0; target < p.steps.length; target++) {
      const items = page.locator('.po-text');
      let at = (await items.allTextContents()).indexOf(p.steps[target]);
      while (at > target) {
        await page.getByRole('button', { name: `Move “${p.steps[target]}” up` }).click();
        at--;
      }
    }
    await page.getByRole('button', { name: /Check my order/ }).click();
    await expect(title(page)).toBeVisible();
    await saved(page, 'Put It in Order');
  });
  test('lost after three wrong checks, played with the keyboard', async ({ page }) => {
    await open(page, 'put-in-order');
    for (let k = 0; k < p.checks; k++) {
      await page.getByRole('button', { name: /Check my order/ }).focus();
      await page.keyboard.press('Enter');
    }
    await expect(page.locator('.result')).toContainText('Today’s answer');
  });
});
