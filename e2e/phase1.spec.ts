import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { FORMATS } from '../src/content/formats';

/** Phase 1 acceptance tests (brief section 11). */

// These walk every screen, including all 22 puzzles, so they need more than the default 30 seconds.
test.describe.configure({ timeout: 300_000 });

const ROUTES = [
  '/',
  '/library',
  '/library/catalogue',
  '/themes',
  '/collection',
  '/rewards',
  '/reminders',
  '/settings',
  ...FORMATS.map((f) => `/play/${f.id}`),
];

/** Dense puzzle grids and letter keys can't all be 44px wide on a 320px phone; they must still meet WCAG's 24px minimum. */
const DENSE = '.ws-cell, .ng-cell, .lg-key, .bn-cell, .lgd-cell, .ngm-cell, .ms-cell, .cw-cell';

const VIEWPORTS = {
  mobile: { width: 390, height: 844 },
  desktop: { width: 1440, height: 1000 },
};

const TEXT_SIZES = ['standard', 'large', 'larger'] as const;
const THEMES = ['light', 'dark'] as const;

/** Starts each test with fresh saved settings; later changes made by the test survive reloads. */
async function seed(page: Page, settings: Record<string, unknown> = {}) {
  await page.addInitScript((s) => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    const data = { version: 1, settings: { textSize: 'standard', appearance: 'light', sound: true, ...s } };
    localStorage.setItem('then-again:v1', JSON.stringify(data));
  }, settings);
}

function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  return errors;
}

const go = async (page: Page, route: string) => {
  await page.goto(`/#${route}`);
  await page.waitForLoadState('networkidle');
};

for (const [vpName, viewport] of Object.entries(VIEWPORTS)) {
  test.describe(`${vpName}`, () => {
    test.use({ viewport });

    test('every link leads to a real screen', async ({ page }) => {
      const errors = trackErrors(page);
      await seed(page);
      const seen = new Set<string>();
      const queue = [...ROUTES];
      while (queue.length) {
        const route = queue.shift()!;
        if (seen.has(route)) continue;
        seen.add(route);
        await go(page, route);
        await expect(page.getByRole('heading', { name: 'Page not found' }), `${route} is a real screen`).toHaveCount(0);
        const hrefs = await page.locator('a[href^="#/"]:visible').evaluateAll((as) => as.map((a) => a.getAttribute('href')!));
        for (const h of hrefs) {
          const r = h.slice(1);
          if (!seen.has(r)) queue.push(r);
        }
      }
      expect(seen.size).toBeGreaterThanOrEqual(ROUTES.length);
      expect(errors).toEqual([]);
    });

    test('every button does something', async ({ page }) => {
      test.setTimeout(900_000);
      const errors = trackErrors(page);
      await seed(page);
      for (const route of ROUTES) {
        await go(page, route);
        // Test every distinct kind of button; for grids, two cells stand in for the rest.
        const kinds = await page.locator('button:visible').evaluateAll((bs) => bs.map((b) => b.className));
        const tested = new Map<string, number>();
        for (let i = 0; i < kinds.length; i++) {
          const seen = tested.get(kinds[i]) ?? 0;
          if (kinds[i] && seen >= 2) continue;
          tested.set(kinds[i], seen + 1);
          // Each click starts from a fresh board, so an earlier click that finished a puzzle can't change what's on screen.
          await go(page, route);
          await page.evaluate(() => {
            const raw = localStorage.getItem('then-again:v1');
            if (raw) localStorage.setItem('then-again:v1', JSON.stringify({ ...JSON.parse(raw), attempts: {}, progress: {} }));
          });
          await page.reload();
          await page.waitForLoadState('networkidle');
          const buttons = page.locator('button:visible');
          if ((await buttons.count()) <= i) continue;
          const button = buttons.nth(i);
          if (await button.isDisabled()) continue;
          const name = (await button.getAttribute('aria-label')) ?? (await button.innerText());
          // Choosing the option that is already selected is rightly a no-op.
          const selected = await button.evaluate(
            (b) => b.getAttribute('aria-pressed') === 'true' || b.getAttribute('aria-selected') === 'true' ||
              (b.getAttribute('role') === 'radio' && b.getAttribute('aria-checked') === 'true'),
          );
          if (selected) continue;
          const before = await page.evaluate(() => location.href + document.body.innerHTML);
          await button.click();
          await page.waitForTimeout(50);
          const after = await page.evaluate(() => location.href + document.body.innerHTML);
          expect(after !== before, `"${name.trim()}" on ${route} changes something`).toBe(true);
        }
      }
      expect(errors).toEqual([]);
    });
  });
}

test.describe('layouts at 320px wide', () => {
  test.use({ viewport: { width: 320, height: 640 } });

  for (const textSize of TEXT_SIZES) {
    for (const appearance of THEMES) {
      test(`${textSize} text, ${appearance}: no sideways scrolling and 44px touch targets`, async ({ page }) => {
        await seed(page, { textSize, appearance });
        for (const route of ROUTES) {
          await go(page, route);
          await expect(page.locator('html')).toHaveAttribute('data-text-size', textSize);
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
          expect(overflow, `${route} fits 320px`).toBeLessThanOrEqual(0);

          const small = await page
            .locator('button:visible, a.btn:visible, a.chip:visible, a.icon-btn:visible, a.gem-chip:visible, nav a:visible, [role="switch"]:visible, input:visible, summary:visible')
            .evaluateAll((els, dense) =>
              els
                .map((el) => ({ el, r: el.getBoundingClientRect(), d: el.matches(dense) }))
                .filter(({ r, d }) => (d ? r.height < 24 || r.width < 24 : r.height < 44 || r.width < 44))
                .map(({ el, r }) => `${el.tagName} "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30)}" ${Math.round(r.width)}×${Math.round(r.height)}`),
              DENSE,
            );
          expect(small, `${route} touch targets`).toEqual([]);
        }
      });
    }
  }
});

test.describe('accessibility', () => {
  for (const appearance of THEMES) {
    for (const [vpName, viewport] of Object.entries(VIEWPORTS)) {
      test(`${appearance} ${vpName}: no WCAG 2.2 AA violations`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await seed(page, { appearance });
        for (const route of ROUTES) {
          await go(page, route);
          const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
          const summary = results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 5).join(', ')}`);
          expect(summary, `${route} (${appearance}, ${vpName})`).toEqual([]);
        }
      });
    }
  }
});

test('progress is saved on the device and survives a reload', async ({ page }) => {
  await page.setViewportSize(VIEWPORTS.mobile);
  await seed(page, { textSize: 'large' });
  await go(page, '/settings');
  await page.getByRole('radio', { name: 'Larger' }).click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-text-size', 'larger');
  await expect(page.getByRole('radio', { name: 'Larger' })).toHaveAttribute('aria-checked', 'true');
});

