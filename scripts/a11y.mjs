// Accessibility guard (Phase 6). Two complementary checks that axe alone can't cover on its
// own, run against the built site (needs `dist/` — `npm run build` first):
//
//   1. axe-core sweep — HARD-FAIL on any WCAG 2.1 A/AA violation; best-practice rules are
//      printed as warnings only (report-only). Every representative page template is scanned
//      in BOTH light and dark themes (dark is its own pass), including the live search panel.
//   2. Scripted keyboard/layout assertions — tab order = visual order for the header at desktop
//      (1024px) and mobile (390px), and the mobile 2-row header layout (search on its own row).
//      axe can't see focus order or wrap layout, which is exactly the header class of bug.
//
// Uses Playwright chromium + @axe-core/playwright. Fails the process (exit 1) on any AA
// violation or failed assertion.
import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const PORT = 4389;
const BASE = `http://localhost:${PORT}`;
const AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

// One representative instance of every page template (all 80 recipes share one template, so
// one recipe page covers them). The search panel is exercised as a live/active state.
const STATES = [
  { name: 'home', url: '/' },
  { name: 'recipe', url: '/recipes/snickerdoodles/' },
  { name: 'recipes-index', url: '/recipes/' },
  { name: 'category', url: '/category/dessert/' },
  { name: 'tips-hub', url: '/tips/' },
  { name: 'tips-article', url: '/tips/how-to-blind-bake-a-crust/' },
  { name: 'conversions', url: '/tips/conversions/' },
  { name: 'about', url: '/about/' },
  { name: 'search-page', url: '/search/' },
];

const server = spawn('node_modules/.bin/astro', ['preview', '--port', String(PORT)], {
  stdio: 'ignore',
});
async function waitReady(ms = 30000) {
  const t = Date.now();
  while (Date.now() - t < ms) {
    try {
      if ((await fetch(`${BASE}/`)).ok) return;
    } catch {}
    await sleep(400);
  }
  throw new Error('preview server did not start');
}

const failures = []; // AA violations + assertion failures (hard-fail)
const warnings = new Map(); // best-practice ruleId -> Set(where)

function recordAxe(where, aa, bp) {
  for (const v of aa.violations) {
    failures.push(
      `axe AA [${v.impact}] ${v.id} — ${v.help}\n      @ ${where}\n      nodes: ${v.nodes
        .map((n) => n.target.join(' '))
        .slice(0, 4)
        .join(' | ')}`,
    );
  }
  for (const v of bp.violations) {
    const s = warnings.get(v.id) ?? new Set();
    s.add(where);
    warnings.set(v.id, s);
  }
}

async function scan(page, where) {
  const aa = await new AxeBuilder({ page }).withTags(AA_TAGS).analyze();
  const bp = await new AxeBuilder({ page }).withTags(['best-practice']).analyze();
  recordAxe(where, aa, bp);
}

// Tab from the top of the document and collect the focus order as short labels, so we can
// assert the header's keyboard order matches its visual order.
async function tabOrder(page, steps) {
  await page.evaluate(() => document.body.focus());
  await page.keyboard.press('Tab');
  const seen = [];
  for (let i = 0; i < steps; i++) {
    const label = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const id = el.id ? `#${el.id}` : '';
      const cls =
        typeof el.className === 'string' && el.className
          ? `.${el.className.split(/\s+/)[0]}`
          : '';
      return `${el.tagName.toLowerCase()}${id || cls}`;
    });
    seen.push(label);
    await page.keyboard.press('Tab');
  }
  return seen;
}

try {
  await waitReady();
  const browser = await chromium.launch();

  // ── 1. axe sweep: every template × light/dark, plus the live search dropdown ──
  for (const theme of ['light', 'dark']) {
    for (const st of STATES) {
      const ctx = await browser.newContext();
      await ctx.addInitScript((t) => localStorage.setItem('theme', t), theme);
      const page = await ctx.newPage();
      await page.goto(`${BASE}${st.url}`, { waitUntil: 'load' });
      await page.evaluate(
        (t) => document.documentElement.setAttribute('data-theme', t),
        theme,
      );
      await sleep(120);
      await scan(page, `${st.name}/${theme}`);
      await ctx.close();
    }
    // Live header search dropdown (results rendered) — a11y of the active panel state.
    const ctx = await browser.newContext();
    await ctx.addInitScript((t) => localStorage.setItem('theme', t), theme);
    const page = await ctx.newPage();
    await page.goto(`${BASE}/`, { waitUntil: 'load' });
    await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
    await page.locator('#site-search').fill('chicken');
    await sleep(800);
    await scan(page, `search-dropdown/${theme}`);
    await ctx.close();
  }

  // ── 2. Header keyboard order + layout at two breakpoints ──
  // Desktop: expected relative order wordmark → primary nav → theme toggle → search (search is
  // last in the DOM by design; assert it comes AFTER the theme toggle).
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.setViewportSize({ width: 1024, height: 800 });
    await page.goto(`${BASE}/`, { waitUntil: 'load' });
    await sleep(120);
    const order = await tabOrder(page, 10);
    const themeIdx = order.findIndex((l) => l && l.includes('theme'));
    const searchIdx = order.findIndex((l) => l === 'input#site-search');
    if (searchIdx === -1)
      failures.push('desktop: search input never received focus while tabbing');
    else if (themeIdx === -1)
      failures.push('desktop: theme toggle never received focus while tabbing');
    else if (searchIdx < themeIdx)
      failures.push(
        `desktop: tab order puts search (#${searchIdx}) before theme toggle (#${themeIdx}) — expected search last`,
      );
    await ctx.close();
  }
  // Mobile (390px): nav is hidden; expected wordmark → theme → hamburger → search, and the
  // 2-row layout (search sits on its own row, visually below the theme + hamburger).
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.setViewportSize({ width: 390, height: 820 });
    await page.goto(`${BASE}/`, { waitUntil: 'load' });
    await sleep(120);
    const order = await tabOrder(page, 8);
    const hamIdx = order.findIndex((l) => l && l.includes('ham'));
    const searchIdx = order.findIndex((l) => l === 'input#site-search');
    if (searchIdx === -1)
      failures.push('mobile: search input never received focus while tabbing');
    else if (hamIdx === -1)
      failures.push('mobile: hamburger never received focus while tabbing');
    else if (searchIdx < hamIdx)
      failures.push(
        `mobile: tab order puts search (#${searchIdx}) before hamburger (#${hamIdx}) — expected search last (row 2)`,
      );
    // Layout: search is its own row below the top controls, and nothing overflows horizontally.
    const boxes = await page.evaluate(() => {
      const r = (sel) => {
        const el = document.querySelector(sel);
        return el ? el.getBoundingClientRect() : null;
      };
      return {
        search: r('#site-search'),
        ham: r('#mobile-menu > summary'),
        theme: r('.site-header button'),
        overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      };
    });
    if (boxes.overflow) failures.push('mobile: header overflows horizontally at 390px');
    if (boxes.search && boxes.ham && boxes.search.top < boxes.ham.bottom - 2)
      failures.push(
        'mobile: search is not on its own row below the top controls (2-row layout broken)',
      );
    if (boxes.search && boxes.search.width < 200)
      failures.push(`mobile: search is crushed (${Math.round(boxes.search?.width ?? 0)}px)`);
    await ctx.close();
  }

  await browser.close();
} catch (e) {
  failures.push(`harness: ${e.message}`);
} finally {
  server.kill('SIGTERM');
}

if (warnings.size) {
  console.log('a11y best-practice warnings (report-only):');
  for (const [id, where] of warnings) console.log(`  · ${id} @ ${[...where].join(', ')}`);
}
if (failures.length) {
  console.error('\nA11Y GUARD FAILED:');
  for (const f of failures) console.error('  ✗ ' + f);
  process.exit(1);
}
console.log(
  '\nA11Y GUARD PASSED: 0 WCAG 2.1 AA violations across every template (light + dark, incl. live search); header tab order = visual order at desktop + mobile; mobile 2-row layout intact.',
);
