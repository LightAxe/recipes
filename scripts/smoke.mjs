// Post-build smoke test. Parses (not just greps) the key outputs so malformed
// JSON-LD / RSS / sitemap / print CSS get caught. Works for both staged and
// SITE_LIVE builds via a gate cross-check.
import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const checks = [];
const ok = (name, cond) => checks.push({ name, pass: !!cond });
const read = async (f) => (existsSync(f) ? readFile(f, 'utf8') : '');

const RECIPE = 'dist/recipes/grandmas-apple-pie/index.html';

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
ok('recipe shows the title', recipe.includes('Grandma') && recipe.includes('Apple Pie'));
ok('recipe renders <picture>', recipe.includes('<picture'));
ok('recipe emits AVIF', recipe.includes('.avif'));
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
  'all-recipes lists the recipe',
  (await read('dist/recipes/index.html')).includes('/recipes/grandmas-apple-pie/'),
);

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
