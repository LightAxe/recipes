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
    } catch {
      /* expected while the preview server is still coming up (connection refused) */
    }
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

async function scan(page, where, exclude = []) {
  const build = () => {
    let b = new AxeBuilder({ page });
    for (const sel of exclude) b = b.exclude(sel);
    return b;
  };
  const aa = await build().withTags(AA_TAGS).analyze();
  const bp = await build().withTags(['best-practice']).analyze();
  recordAxe(where, aa, bp);
}

// Compute the WCAG contrast ratio between an element's (or pseudo-element's) text colour and
// its background, straight from getComputedStyle — for cases axe can't reach (::before/::after
// generated content, off-screen-until-focus elements). Returns { ok, ratio, fg, bg } or
// { ok: null, reason }.
async function badgeContrast(page, selector, pseudo) {
  return page.evaluate(
    ({ selector, pseudo }) => {
      const el = document.querySelector(selector);
      if (!el) return { ok: null, reason: 'element not found' };
      const cs = getComputedStyle(el, pseudo || undefined);
      // Handle both comma and modern space/slash rgb() serialisations, and capture alpha.
      const parse = (s) => {
        const m = s && s.match(/rgba?\(([^)]+)\)/i);
        if (!m) return null;
        const parts = m[1]
          .split(/[\s,/]+/)
          .filter(Boolean)
          .map(Number);
        const [r, g, b, a] = parts;
        if ([r, g, b].some((n) => Number.isNaN(n))) return null;
        return { rgb: [r, g, b], a: a === undefined ? 1 : a };
      };
      const fg = parse(cs.color);
      const bg = parse(cs.backgroundColor);
      if (!fg || !bg)
        return {
          ok: null,
          reason: `unreadable colours (${cs.color} / ${cs.backgroundColor})`,
        };
      // A translucent background can't be scored without compositing it over the real backdrop;
      // refuse to guess (returns a measurable failure, never a false pass).
      if (bg.a < 1)
        return {
          ok: null,
          reason: `translucent background (${cs.backgroundColor}) — cannot score`,
        };
      const lin = (c) => {
        c /= 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      };
      const L = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
      const l1 = L(fg.rgb);
      const l2 = L(bg.rgb);
      const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      return {
        ok: ratio >= 4.5,
        ratio: Math.round(ratio * 100) / 100,
        fg: cs.color,
        bg: cs.backgroundColor,
      };
    },
    { selector, pseudo },
  );
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

let browser;
try {
  await waitReady();
  browser = await chromium.launch();
  const themedPage = async (theme, url) => {
    const ctx = await browser.newContext();
    await ctx.addInitScript((t) => localStorage.setItem('theme', t), theme);
    const page = await ctx.newPage();
    await page.goto(`${BASE}${url}`, { waitUntil: 'load' });
    await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
    return { ctx, page };
  };

  // ── 1. axe sweep: every template × light/dark, plus INTERACTIVE states axe can't reach
  //       at page-load (active pressed control, open search panel, open mobile nav sheet).
  //       Those states are exactly where contrast/structure bugs hide (a page-load-only scan
  //       missed a pressed-toggle AA failure), so we must enter them before scanning. ──
  for (const theme of ['light', 'dark']) {
    for (const st of STATES) {
      const { ctx, page } = await themedPage(theme, st.url);
      await sleep(120);
      await scan(page, `${st.name}/${theme}`);
      await ctx.close();
    }
    // Recipe page with cook mode ON — puts .toggle into its aria-pressed="true" state
    // (white-on-accent), which a load-time scan never sees. Cook mode HIDES the surrounding
    // chrome (breadcrumb/meta/lede/story/header/footer are display:none — issue #25), so there's
    // nothing to exclude: axe skips hidden subtrees, and the pressed control + enlarged steps
    // are scanned normally.
    {
      const { ctx, page } = await themedPage(theme, '/recipes/snickerdoodles/');
      await page.locator('#cookmode-btn').click();
      await sleep(150);
      await scan(page, `recipe-cookmode/${theme}`);
      await ctx.close();
    }
    // Live header search dropdown (results rendered) — a11y of the active panel state.
    {
      const { ctx, page } = await themedPage(theme, '/');
      await page.locator('#site-search').fill('chicken');
      await sleep(800);
      await scan(page, `search-dropdown/${theme}`);
      await ctx.close();
    }
    // Desktop Categories dropdown OPEN — a native <details>, so its link list is hidden from
    // the a11y tree (and axe) when closed; open it at desktop width to scan the panel.
    {
      const { ctx, page } = await themedPage(theme, '/');
      await page.setViewportSize({ width: 1024, height: 800 });
      await page.locator('#cats-menu > summary').click();
      await sleep(150);
      await scan(page, `cats-dropdown/${theme}`);
      await ctx.close();
    }
    // Mobile viewport with the hamburger sheet OPEN — the nav sheet is display:none on desktop,
    // so axe excludes its subtree unless we shrink + open it. Loaded on /tips/ so a sheet link
    // carries aria-current="page" (its --sunken/--accent-ink active style gets scanned too).
    {
      const { ctx, page } = await themedPage(theme, '/tips/');
      await page.setViewportSize({ width: 390, height: 820 });
      await page.locator('#mobile-menu > summary').click();
      await sleep(150);
      await scan(page, `mobile-nav-open/${theme}`);
      await ctx.close();
    }
    // Computed-contrast of accent "badges" that axe structurally CANNOT evaluate: CSS
    // ::before/::after generated content (the step-number badges) and elements positioned
    // off-screen until focus (the skip link). Two AA fails reached review through this exact
    // blind spot, so we compute the ratio from getComputedStyle directly here.
    {
      const { ctx, page } = await themedPage(theme, '/recipes/snickerdoodles/');
      await sleep(100);
      for (const [label, selector, pseudo] of [
        ['step-number badge', '.steps li', '::before'],
        ['skip link', '.skip-link', null],
      ]) {
        const res = await badgeContrast(page, selector, pseudo);
        if (res.ok === null)
          failures.push(`contrast: could not measure ${label} (${theme}) — ${res.reason}`);
        else if (!res.ok)
          failures.push(
            `contrast: ${label} ${res.ratio}:1 (< 4.5) in ${theme} — ${res.fg} on ${res.bg}`,
          );
      }
      await ctx.close();
    }
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
  // browser is closed in finally (covers both the happy path and a mid-loop throw).
} catch (e) {
  failures.push(`harness: ${e.message}`);
} finally {
  // Close the browser here (not at the end of try) so a mid-loop Playwright error doesn't
  // orphan the Chromium process on the CI runner.
  await browser?.close().catch(() => {});
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
