// Headless browser smoke: loads the built pages and FAILS on any console error /
// pageerror (this is what would have caught the TDZ crash that killed all the recipe
// interactivity), and verifies the scaler actually changes an amount. Run: needs `dist/`
// built first (npm run build). Uses Playwright chromium.
import { chromium, webkit } from 'playwright';
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const PORT = 4388;
const BASE = `http://localhost:${PORT}`;
const errors = [];

const server = spawn('node_modules/.bin/astro', ['preview', '--port', String(PORT)], {
  stdio: 'ignore',
});

async function waitReady(timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(`${BASE}/`);
      if (r.ok) return;
    } catch {
      /* not up yet */
    }
    await sleep(400);
  }
  throw new Error('preview server did not start');
}

try {
  await waitReady();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console.error: ${m.text()}`);
  });

  for (const p of ['/', '/recipes/', '/recipes/snickerdoodles/']) {
    await page.goto(`${BASE}${p}`, { waitUntil: 'load' });
    await sleep(150); // let the deferred module run
  }

  // Recipe page: controls revealed + scaler actually changes an amount.
  await page.goto(`${BASE}/recipes/snickerdoodles/`, { waitUntil: 'load' });
  await sleep(200);
  if ((await page.locator('#controls').getAttribute('hidden')) !== null) {
    errors.push('controls still [hidden] — init() did not run');
  }
  const before = await page.locator('.amount').first().textContent();
  await page.locator('[data-scale="2"]').click();
  await sleep(150);
  const after = await page.locator('.amount').first().textContent();
  if (before === after) errors.push(`scaler did not rescale amount (still "${before}")`);

  // ── Phase 3: /recipes/ facet filter (progressive enhancement) ──
  await page.goto(`${BASE}/recipes/`, { waitUntil: 'load' });
  await sleep(200);
  if ((await page.locator('#facets').getAttribute('hidden')) !== null) {
    errors.push('facet panel still [hidden] — filter JS did not init');
  }
  const totalCards = await page.locator('#recipe-grid > li:not([hidden])').count();
  await page.locator('#facets input[data-axis="course"]').first().check();
  await sleep(150);
  const filtered = await page.locator('#recipe-grid > li:not([hidden])').count();
  if (!(filtered > 0 && filtered < totalCards)) {
    errors.push(`facet filter did not narrow the grid (${totalCards} → ${filtered})`);
  }
  if (!/[?&]course=/.test(page.url())) {
    errors.push(`facet filter did not write URL state (${page.url()})`);
  }

  // Back button restores the unfiltered grid (popstate re-applies state).
  await page.goBack();
  await page
    .waitForFunction(
      (n) => document.querySelectorAll('#recipe-grid > li:not([hidden])').length === n,
      totalCards,
      { timeout: 3000 },
    )
    .catch(() => {});
  const afterBack = await page.locator('#recipe-grid > li:not([hidden])').count();
  if (afterBack !== totalCards) {
    errors.push(`Back did not restore the full grid (${afterBack} vs ${totalCards})`);
  }

  // Deep-link hydration: a shared filtered URL pre-filters the grid on load.
  await page.goto(`${BASE}/recipes/?course=dessert`, { waitUntil: 'load' });
  await page
    .waitForFunction(
      () => {
        const g = document.getElementById('recipe-grid');
        if (!g) return false;
        const vis = g.querySelectorAll('li:not([hidden])').length;
        return vis > 0 && vis < g.querySelectorAll('li').length;
      },
      undefined,
      { timeout: 3000 },
    )
    .catch(() => {});
  const deepVisible = await page.locator('#recipe-grid > li:not([hidden])').count();
  if (!(deepVisible > 0 && deepVisible < totalCards)) {
    errors.push(`deep-link did not pre-filter the grid (${deepVisible}/${totalCards})`);
  }
  if (
    !(await page.locator('#facets input[value="dessert"][data-axis="course"]').isChecked())
  ) {
    errors.push('deep-link did not check the matching facet on load');
  }

  // ── Categories dropdown opens (native <details>, JS-enhanced) ──
  await page.locator('#cats-menu > summary').click();
  await sleep(80);
  if (!(await page.locator('#cats-menu').evaluate((d) => d.open))) {
    errors.push('Categories dropdown did not open');
  }

  // ── Site-wide search returns a hit (Pagefind lazy-loads on focus/typing) ──
  await page.locator('#site-search').fill('chicken');
  await sleep(700);
  const hits = await page.locator('#site-search-results .sr-card').count();
  if (hits < 1) errors.push('search returned no results for "chicken"');

  // ── Phase 4: mobile hamburger (native <details>, JS-enhanced) ──
  await page.setViewportSize({ width: 390, height: 820 });
  await page.goto(`${BASE}/`, { waitUntil: 'load' });
  await sleep(150);
  const ham = page.locator('#mobile-menu > summary');
  if (!(await ham.isVisible())) errors.push('hamburger not visible at mobile width');
  await ham.click();
  await sleep(80);
  if (!(await page.locator('#mobile-menu').evaluate((d) => d.open))) {
    errors.push('hamburger did not open');
  }
  if (!(await page.locator('#mobile-menu .sheet a[href="/tips/"]').isVisible())) {
    errors.push('hamburger sheet is missing the Tips link');
  }
  // The open sheet must sit WITHIN the viewport horizontally. Guards the class of bug where the
  // panel is right-anchored to a hamburger that wrapped to the left, rendering the menu (labels
  // and all) off-screen to the left with only the right-aligned counts peeking in.
  const sheetBox = await page.locator('#mobile-menu .sheet').evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { left: Math.round(r.left), right: Math.round(r.right), vw: window.innerWidth };
  });
  if (sheetBox.left < 0 || sheetBox.right > sheetBox.vw + 1) {
    errors.push(
      `mobile menu sheet is off-screen (left ${sheetBox.left}, right ${sheetBox.right}, viewport ${sheetBox.vw})`,
    );
  }
  await page.keyboard.press('Escape');
  await sleep(80);
  if (await page.locator('#mobile-menu').evaluate((d) => d.open)) {
    errors.push('hamburger did not close on Escape');
  }
  // Header must wrap (not overflow) at phone width, and the search must stay usable (its own
  // full-width row) rather than being crushed by the wordmark + theme + hamburger.
  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  if (overflows) errors.push('page overflows horizontally at 390px (header not wrapping)');
  const searchW = await page
    .locator('#site-search')
    .evaluate((el) => el.getBoundingClientRect().width);
  if (searchW < 200) errors.push(`mobile search is crushed (${Math.round(searchW)}px wide)`);

  // ── Very-narrow-phone (320px) horizontal-overflow guard across representative page types.
  // The smallest phones (e.g. iPhone SE 1st-gen) must not scroll sideways. Guards the class of
  // bug where a fixed-width control/input/tile forces the page wider than the viewport: the hero
  // + page search inputs (intrinsic min-width), the homepage category tiles, and the recipe
  // scaler row. The recipe page is picked from the live grid so this stays robust to renames. ──
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto(`${BASE}/recipes/`, { waitUntil: 'load' });
  const firstRecipe = await page.locator('a.card').first().getAttribute('href');
  for (const path of ['/', '/recipes/', '/search/', '/tips/', firstRecipe].filter(Boolean)) {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(`${BASE}${path}`, { waitUntil: 'load' });
    await sleep(80);
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    if (sw > 321) errors.push(`${path} overflows horizontally at 320px (scrollWidth ${sw})`);
  }

  // ── #13: /search/ course filter plane (progressive enhancement) ──
  await page.setViewportSize({ width: 1100, height: 900 });
  await page.goto(`${BASE}/search/`, { waitUntil: 'load' });
  await page.locator('#search-page-input').fill('chicken');
  await sleep(1000);
  const sTotal = await page.locator('#search-page-results .sr-card').count();
  if (sTotal < 2)
    errors.push(`/search/ "chicken" returned ${sTotal} cards (expected several)`);
  if (!(await page.locator('#search-page-results .sr-meta').first().count())) {
    errors.push('/search/ result card is missing its time·serves meta line (#13)');
  }
  if (!(await page.locator('#course-filter').isVisible())) {
    errors.push('/search/ course filter plane did not appear for an active query');
  }
  // Filter to one course → narrows + writes ?course=
  await page.locator('#course-filter input[value="main"]').check();
  await sleep(800);
  const sMain = await page.locator('#search-page-results .sr-card').count();
  if (!(sMain > 0 && sMain < sTotal)) {
    errors.push(`course filter did not narrow /search/ (${sTotal} → ${sMain})`);
  }
  if (!/[?&]course=main/.test(page.url())) {
    errors.push(`course filter did not write URL state (${page.url()})`);
  }
  // Add a second course → the set must be the OR/union (guards the {any:[...]} fix), not smaller.
  const hasSoup = (await page.locator('#course-filter input[value="soup"]').count()) > 0;
  if (hasSoup) {
    await page.locator('#course-filter input[value="soup"]').check();
    await sleep(800);
    const sOr = await page.locator('#search-page-results .sr-card').count();
    if (sOr < sMain)
      errors.push(`two-course filter shrank instead of OR-ing (${sMain} → ${sOr})`);
  }
  // Back restores the previous (single-course) selection via popstate.
  await page.goBack();
  await sleep(700);
  if (hasSoup && (await page.locator('#course-filter input[value="soup"]').isChecked())) {
    errors.push('Back did not undo the second course filter on /search/ (popstate)');
  }
  // A query with NO matches must NOT leave an empty filter-plane shell (visibility gated on
  // the query having unfiltered matches).
  await page.locator('#search-page-input').fill('zzzqqqxxnope');
  await sleep(800);
  if (await page.locator('#course-filter').isVisible()) {
    errors.push('course filter plane showed an empty shell for a zero-match query');
  }
  // Empty query hides the plane + restores the browse fallback.
  await page.locator('#search-page-input').fill('');
  await sleep(500);
  if (await page.locator('#course-filter').isVisible()) {
    errors.push('course filter plane stayed visible with an empty query');
  }

  await browser.close();

  // ── WebKit (Safari engine): link/button activation inside the JS-enhanced menus ──
  // Safari doesn't focus <a>/<button> on click, so a menu's focusout fires with a null
  // relatedTarget — a naive "close on focusout" tears the panel down mid-mousedown and the
  // click never lands. This shipped to production once (Categories links dead in Safari) because
  // the smoke ran Chromium only. These checks run in WebKit specifically to guard that class.
  const wk = await webkit.launch();
  const wkPage = await (
    await wk.newContext({ viewport: { width: 1200, height: 800 } })
  ).newPage();
  // Categories dropdown → a category link must navigate.
  await wkPage.goto(`${BASE}/`, { waitUntil: 'load' });
  await sleep(150);
  await wkPage.locator('#cats-menu > summary').click();
  await sleep(100);
  const catHref = await wkPage.locator('#cats-menu .cats-list a').first().getAttribute('href');
  await wkPage.locator('#cats-menu .cats-list a').first().click();
  await sleep(400);
  if (!wkPage.url().endsWith(catHref)) {
    errors.push(`webkit: Categories link did not navigate (still ${wkPage.url()})`);
  }
  // Search dropdown → a result link must navigate.
  await wkPage.goto(`${BASE}/`, { waitUntil: 'load' });
  await sleep(150);
  await wkPage.locator('#site-search').fill('chicken');
  await sleep(900);
  if ((await wkPage.locator('#site-search-results .sr-card').count()) > 0) {
    const rHref = await wkPage
      .locator('#site-search-results .sr-card')
      .first()
      .getAttribute('href');
    await wkPage.locator('#site-search-results .sr-card').first().click();
    await sleep(400);
    if (!wkPage.url().includes(rHref)) {
      errors.push(`webkit: search result did not navigate (still ${wkPage.url()})`);
    }
  } else {
    errors.push('webkit: search returned no results for "chicken"');
  }
  // /search/ page → a result that's been narrowed by a course FILTER must still navigate (the
  // filter re-renders the result cards, so this re-checks the Safari focus class on fresh nodes).
  await wkPage.goto(`${BASE}/search/`, { waitUntil: 'load' });
  await sleep(150);
  await wkPage.locator('#search-page-input').fill('chicken');
  await sleep(1000);
  if ((await wkPage.locator('#course-filter input[value="main"]').count()) > 0) {
    await wkPage.locator('#course-filter input[value="main"]').check();
    await sleep(700);
    const fHref = await wkPage
      .locator('#search-page-results .sr-card')
      .first()
      .getAttribute('href');
    await wkPage.locator('#search-page-results .sr-card').first().click();
    await sleep(400);
    if (fHref && !wkPage.url().includes(fHref)) {
      errors.push(`webkit: filtered /search/ result did not navigate (still ${wkPage.url()})`);
    }
  }
  // Mobile hamburger sheet → a link must navigate.
  await wkPage.setViewportSize({ width: 390, height: 820 });
  await wkPage.goto(`${BASE}/`, { waitUntil: 'load' });
  await sleep(150);
  await wkPage.locator('#mobile-menu > summary').click();
  await sleep(100);
  await wkPage.locator('#mobile-menu .sheet a[href="/tips/"]').click();
  await sleep(400);
  if (!wkPage.url().endsWith('/tips/')) {
    errors.push(`webkit: mobile menu link did not navigate (still ${wkPage.url()})`);
  }
  // Print menu → a print option's click handler must fire (menu not torn down on mousedown).
  await wkPage.setViewportSize({ width: 1200, height: 800 });
  await wkPage.goto(`${BASE}/recipes/snickerdoodles/`, { waitUntil: 'load' });
  await sleep(200);
  await wkPage.evaluate(() => {
    window.__printed = 0;
    window.print = () => {
      window.__printed++;
    };
  });
  await wkPage.locator('.print-menu > summary').click();
  await sleep(100);
  await wkPage.locator('.print-menu [data-print="clean"]').click();
  await sleep(150);
  if (!(await wkPage.evaluate(() => window.__printed))) {
    errors.push('webkit: print option did not fire (menu closed on mousedown)');
  }
  await wk.close();
} catch (e) {
  errors.push(`harness: ${e.message}`);
} finally {
  server.kill('SIGTERM');
}

if (errors.length) {
  console.error('BROWSER SMOKE FAILED:');
  for (const e of errors) console.error('  ✗ ' + e);
  process.exit(1);
}
console.log(
  'BROWSER SMOKE PASSED: no console errors; scaler rescales; facet filter narrows + writes URL; Back + deep-link hydrate; Categories dropdown opens; search returns a hit.',
);
