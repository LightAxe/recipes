// Headless browser smoke: loads the built pages and FAILS on any console error /
// pageerror (this is what would have caught the TDZ crash that killed all the recipe
// interactivity), and verifies the scaler actually changes an amount. Run: needs `dist/`
// built first (npm run build). Uses Playwright chromium.
import { chromium } from 'playwright';
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

  await browser.close();
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
console.log('BROWSER SMOKE PASSED: no console errors; controls revealed; scaler rescales.');
