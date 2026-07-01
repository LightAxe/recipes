// Post-build smoke test. Parses (not just greps) the key outputs so malformed
// JSON-LD / RSS / sitemap / print CSS get caught. Works for both staged and
// SITE_LIVE builds via a gate cross-check.
import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const checks = [];
const ok = (name, cond) => checks.push({ name, pass: !!cond });
const read = async (f) => (existsSync(f) ? readFile(f, 'utf8') : '');

const RECIPE = 'dist/recipes/snickerdoodles/index.html';

for (const f of [
  'dist/index.html',
  'dist/recipes/index.html',
  RECIPE,
  'dist/404.html',
  'dist/rss.xml',
  'dist/robots.txt',
  'dist/sitemap-index.xml',
  'dist/sitemap-0.xml',
]) {
  ok(`route/file exists: ${f}`, existsSync(f));
}

const recipe = await read(RECIPE);
ok('recipe shows the title', recipe.includes('Snickerdoodles'));
// (Image-pipeline checks — <picture>/AVIF — return once real recipe photos are added;
// no recipe currently ships an image.)
ok('universe footer', recipe.includes('cinematic universe'));
ok('interactive controls present', recipe.includes('id="controls"'));
ok('amount data attributes present', /class="amount"[^>]*data-grams=/.test(recipe));
ok(
  '4×6 @page card stylesheet present',
  recipe.includes('@page') && recipe.includes('4in 6in'),
);

// Parse the Recipe JSON-LD block.
let recipeLd = null;
for (const block of recipe.match(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g) ||
  []) {
  const body = block.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, '');
  try {
    const o = JSON.parse(body);
    if (o['@type'] === 'Recipe') recipeLd = o;
  } catch {
    ok('JSON-LD block parses', false);
  }
}
ok(
  'Recipe JSON-LD valid',
  recipeLd &&
    recipeLd.name &&
    Array.isArray(recipeLd.recipeIngredient) &&
    recipeLd.recipeIngredient.length > 0,
);

// RSS + sitemap shape.
const rss = await read('dist/rss.xml');
ok('RSS has channel + items', rss.includes('<rss') && rss.includes('<item>'));
ok(
  'sitemap index references a sitemap',
  (await read('dist/sitemap-index.xml')).includes('sitemap-0.xml'),
);

// Launch gate cross-check: robots advertises a Sitemap ⟺ pages are NOT noindex.
const robots = await read('dist/robots.txt');
const live = /Sitemap:/i.test(robots);
const noindex = /name="robots"\s+content="noindex"/.test(recipe);
ok(`launch gate consistent (${live ? 'live' : 'staged'})`, live ? !noindex : noindex);

// Cloudflare Web Analytics beacon: present on live, absent on staged (same gate).
const beacon = recipe.includes('static.cloudflareinsights.com/beacon.min.js');
ok(`analytics beacon ${live ? 'present (live)' : 'absent (staged)'}`, live ? beacon : !beacon);

// Print stylesheet bundled.
let hasPrint = false;
if (existsSync('dist/_astro')) {
  for (const f of (await readdir('dist/_astro')).filter((f) => f.endsWith('.css'))) {
    if ((await read(`dist/_astro/${f}`)).includes('@media print')) hasPrint = true;
  }
}
ok('print stylesheet present', hasPrint);

const home = await read('dist/index.html');
ok('home links to /recipes/', home.includes('/recipes/'));
ok(
  'home has category tiles',
  home.includes('Browse by category') && home.includes('/category/'),
);
ok(
  'all-recipes lists the recipe',
  (await read('dist/recipes/index.html')).includes('/recipes/snickerdoodles/'),
);

// ── Phase 3: browse & find ──────────────────────────────────────────────────
const dessert = await read('dist/category/dessert/index.html');
ok(
  'category page renders a card grid of recipes',
  dessert.includes('class="grid"') && (dessert.match(/href="\/recipes\//g) || []).length > 3,
);
ok(
  'taxonomy routes built (tag / cuisine / from)',
  existsSync('dist/tag/chicken/index.html') &&
    existsSync('dist/cuisine/american/index.html') &&
    existsSync('dist/from/sandy/index.html'),
);

// BreadcrumbList must be Google-valid: every non-last ListItem needs an `item` URL, so the
// non-linking axis segment is dropped from the JSON-LD (not emitted URL-less).
let crumb = null;
for (const block of dessert.match(
  /<script type="application\/ld\+json">[\s\S]*?<\/script>/g,
) || []) {
  const body = block.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, '');
  try {
    const o = JSON.parse(body);
    if (o['@type'] === 'BreadcrumbList') crumb = o;
  } catch {
    /* not this block */
  }
}
ok(
  'taxonomy BreadcrumbList valid (non-last items have item URL)',
  crumb &&
    Array.isArray(crumb.itemListElement) &&
    crumb.itemListElement.length >= 2 &&
    crumb.itemListElement.slice(0, -1).every((li) => typeof li.item === 'string'),
);

// The recipe page's 3-item breadcrumb must also be valid (regression guard).
let recipeCrumb = null;
for (const block of recipe.match(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g) ||
  []) {
  const body = block.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, '');
  try {
    const o = JSON.parse(body);
    if (o['@type'] === 'BreadcrumbList') recipeCrumb = o;
  } catch {
    /* not this block */
  }
}
ok(
  'recipe BreadcrumbList valid (non-last items have item URL)',
  recipeCrumb &&
    Array.isArray(recipeCrumb.itemListElement) &&
    recipeCrumb.itemListElement.length === 3 &&
    recipeCrumb.itemListElement.slice(0, -1).every((li) => typeof li.item === 'string'),
);

// ── #12: singleton + sitemap rules, checked DATA-INDEPENDENTLY across all four axes ──
// Derive each taxonomy page's recipe count from its own built output (the distinct
// /recipes/<slug>/ links it renders) instead of hard-coding term slugs. The rule: a
// singleton (1 recipe) page is always noindex + excluded from the sitemap; a multi-recipe
// page follows the SITE_LIVE gate (indexable on live) + is included. This can't drift as the
// collection changes — new/renamed terms are covered automatically.
const sitemap = await read('dist/sitemap-0.xml');
// Count DISTINCT recipe slugs on a taxonomy page. Each recipe appears twice (its card <a href>
// and its absolute URL inside the ItemList JSON-LD); the Set collapses those. Nav/footer only
// link `/recipes/` (no slug), so they contribute nothing. TaxonomyList renders only <CardGrid>,
// so there are no cross-recipe links to inflate the count.
const recipeLinkCount = (html) =>
  new Set(html.match(/\/recipes\/[a-z0-9]+(?:-[a-z0-9]+)*\//g) || []).size;

let taxPages = 0;
let singletons = 0;
let multi = 0;
for (const axis of ['category', 'cuisine', 'tag', 'from']) {
  const dir = `dist/${axis}`;
  if (!existsSync(dir)) continue;
  for (const term of await readdir(dir)) {
    const f = `dist/${axis}/${term}/index.html`;
    if (!existsSync(f)) continue;
    taxPages++;
    const html = await read(f);
    const count = recipeLinkCount(html);
    const noindex = /name="robots"\s+content="noindex"/.test(html);
    const inSitemap = sitemap.includes(`/${axis}/${term}/`);
    // Singleton == exactly 1 recipe, matching TaxonomyList's `recipes.length === 1` noindex
    // rule (a taxonomy term only builds a page when ≥1 recipe uses it, so 0 can't occur).
    if (count === 1) {
      singletons++;
      ok(`singleton /${axis}/${term}/ is noindex`, noindex);
      ok(`singleton /${axis}/${term}/ excluded from sitemap`, !inSitemap);
    } else {
      multi++;
      ok(`multi /${axis}/${term}/ in sitemap`, inSitemap);
      if (live) ok(`multi /${axis}/${term}/ indexable on live build`, !noindex);
    }
  }
}
// The rules are only meaningfully exercised if the collection actually contains both kinds.
ok('taxonomy pages were found to check', taxPages > 0);
ok(
  'at least one singleton and one multi-recipe page exist to cover both rules',
  singletons > 0 && multi > 0,
);

// Every built recipe page appears in the sitemap (derived from dist, not a fixed count).
const recipeSlugs = (await readdir('dist/recipes')).filter((s) =>
  existsSync(`dist/recipes/${s}/index.html`),
);
const missingFromSitemap = recipeSlugs.filter((s) => !sitemap.includes(`/recipes/${s}/`));
ok(`all ${recipeSlugs.length} recipes are in the sitemap`, missingFromSitemap.length === 0);

// The /search/ utility page is permanently excluded from the sitemap.
ok('search page excluded from sitemap', !sitemap.includes('/search/'));

// Search: the page exists and Pagefind generated its static index at build (postbuild).
ok('search page exists', existsSync('dist/search/index.html'));
ok('pagefind index generated', existsSync('dist/pagefind/pagefind.js'));

// ── Phase 4: reference content (tips, conversions, about) + nav + no-photo card ──
const tipsHub = await read('dist/tips/index.html');
ok(
  'tips hub lists tips + features Conversions',
  tipsHub.includes('/tips/conversions/') && tipsHub.includes('/tips/useful-information/'),
);
const tipPage = await read('dist/tips/how-to-blind-bake-a-crust/index.html');
ok('tip page renders its body', tipPage.includes('pie shell'));
const conv = await read('dist/tips/conversions/index.html');
ok('conversions page has data tables', conv.includes('<caption') && conv.includes('120 g'));
const about = await read('dist/about/index.html');
ok('about page has contribute section', about.includes('mailto:rob@axpr.net'));

ok(
  'header has Tips + About',
  home.includes('href="/tips/"') && home.includes('href="/about/"'),
);
ok('mobile hamburger present', home.includes('id="mobile-menu"'));

const recipesIndex = await read('dist/recipes/index.html');
ok(
  'no-photo cards use a course icon, not "Ogilvie"',
  !recipesIndex.includes('>Ogilvie<') && /class="ph-icon"[^>]*viewBox/.test(recipesIndex),
);

const parseCrumb = (html) => {
  for (const block of html.match(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g) ||
    []) {
    const b = block.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, '');
    try {
      const o = JSON.parse(b);
      if (o['@type'] === 'BreadcrumbList') return o;
    } catch {
      /* not this block */
    }
  }
  return null;
};
const newPages = [
  ['tips hub', tipsHub],
  ['tip', tipPage],
  ['conversions', conv],
  ['about', about],
];
for (const [name, html] of newPages) {
  const c = parseCrumb(html);
  ok(
    `${name} BreadcrumbList valid`,
    c &&
      Array.isArray(c.itemListElement) &&
      c.itemListElement.length >= 2 &&
      c.itemListElement.slice(0, -1).every((li) => typeof li.item === 'string'),
  );
  ok(
    `${name} not Pagefind-indexed (no data-pagefind-body)`,
    !html.includes('data-pagefind-body'),
  );
}

ok('sitemap includes tips hub', sitemap.includes('/tips/'));
ok('sitemap includes a tip', sitemap.includes('/tips/useful-information/'));
ok('sitemap includes conversions', sitemap.includes('/tips/conversions/'));
ok('sitemap includes about', sitemap.includes('/about/'));

let failed = 0;
for (const c of checks) {
  if (!c.pass) failed++;
  console.log(`${c.pass ? '✓' : '✗'} ${c.name}`);
}
if (failed) {
  console.error(`\nSMOKE FAILED: ${failed}/${checks.length} check(s)`);
  process.exit(1);
}
console.log(`\nSMOKE PASSED: ${checks.length} checks`);
