// Performance budget gate (Phase 6). Deterministic, blocking, and — crucially — GROWTH-AWARE:
// budgets that scale with the collection (the recipes index, the Pagefind index) are expressed
// as "baseline + per-recipe allowance × recipe count" so simply adding recipes never trips them;
// only a real regression (a heavier template, a big new dependency, an un-optimised asset) does.
// No Lighthouse here — this measures raw bytes + a DOM-size proxy straight off dist/, so it can
// never flake on CI runner noise. Compressed (gzip) sizes are printed for context; the gate is
// on raw bytes because our S3/CloudFront config doesn't guarantee a specific content-encoding.
// Run after a build. Exit 1 if any route is over budget.
import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const bytes = (f) => (existsSync(f) ? statSync(f).size : 0);
const read = (f) => (existsSync(f) ? readFileSync(f, 'utf8') : '');
// DOM-size proxy: count of opening tags. Deterministic and only moves on real structure change.
const tagCount = (f) => (read(f).match(/<[a-zA-Z][^>]*>/g) || []).length;
const gz = (f) => (existsSync(f) ? gzipSync(readFileSync(f)).length : 0);
const kb = (n) => `${(n / 1000).toFixed(1)}kB`;
function dirBytes(d) {
  if (!existsSync(d)) return 0;
  return readdirSync(d, { withFileTypes: true }).reduce(
    (s, e) => s + (e.isDirectory() ? dirBytes(`${d}/${e.name}`) : bytes(`${d}/${e.name}`)),
    0,
  );
}

const recipeSlugs = existsSync('dist/recipes')
  ? readdirSync('dist/recipes').filter((s) => existsSync(`dist/recipes/${s}/index.html`))
  : [];
const N = recipeSlugs.length;
if (N === 0) {
  console.error('perf-budget: no recipe pages in dist/ — build first (npm run build).');
  process.exit(1);
}

// Budgets seeded from the current build + headroom (~1.4–2×): tight enough to catch a real
// regression, loose enough that normal edits/growth don't. Update deliberately when a change
// legitimately raises a floor (and say why in the commit).
const FIXED = {
  'shared JS (_astro/*.js)': { measure: sharedJsBytes(), budget: 16_000, unit: 'bytes' },
  'home page html': { measure: bytes('dist/index.html'), budget: 40_000, unit: 'bytes' },
  'home page DOM (tags)': { measure: tagCount('dist/index.html'), budget: 420, unit: 'tags' },
};
// Growth budgets: baseline + perRecipe × N. These pages get bigger as the collection grows.
const GROWTH = {
  'recipes index html': {
    measure: bytes('dist/recipes/index.html'),
    budget: 25_000 + 2_000 * N,
    unit: 'bytes',
  },
  'recipes index DOM (tags)': {
    measure: tagCount('dist/recipes/index.html'),
    budget: 300 + 26 * N,
    unit: 'tags',
  },
  'pagefind index (lazy)': {
    measure: dirBytes('dist/pagefind'),
    budget: 120_000 + 12_000 * N,
    unit: 'bytes',
  },
};
// Recipe pages vary by length; gate the max and p95 (catches a template regression across all
// pages, while leaving headroom for one genuinely long recipe) rather than a single sample.
const recipeBytes = recipeSlugs
  .map((s) => bytes(`dist/recipes/${s}/index.html`))
  .sort((a, b) => a - b);
const recipeTags = recipeSlugs
  .map((s) => tagCount(`dist/recipes/${s}/index.html`))
  .sort((a, b) => a - b);
const pct = (a, q) => a[Math.min(a.length - 1, Math.floor(a.length * q))];
const RECIPE = {
  'recipe page html (max)': { measure: recipeBytes.at(-1), budget: 48_000, unit: 'bytes' },
  'recipe page html (p95)': { measure: pct(recipeBytes, 0.95), budget: 42_000, unit: 'bytes' },
  'recipe page DOM (max tags)': { measure: recipeTags.at(-1), budget: 500, unit: 'tags' },
};

const failures = [];
const rows = [];
for (const [name, { measure, budget, unit }] of Object.entries({
  ...FIXED,
  ...GROWTH,
  ...RECIPE,
})) {
  const over = measure > budget;
  if (over) failures.push(`${name}: ${measure} ${unit} > budget ${budget}`);
  const val =
    unit === 'bytes' ? `${kb(measure)}/${kb(budget)}` : `${measure}/${budget} ${unit}`;
  rows.push(`  ${over ? '✗' : '✓'} ${name.padEnd(28)} ${val}`);
}

console.log(`perf-budget: ${N} recipes. measured / budget:`);
console.log(rows.join('\n'));
// Compressed sizes for context (not gated — CDN encoding isn't guaranteed).
console.log(
  `  (gzip context: shared JS ≈ ${kb(sharedJsGz())}, a recipe page ≈ ` +
    `${kb(gz(`dist/recipes/${recipeSlugs[0]}/index.html`))}, home ≈ ${kb(gz('dist/index.html'))})`,
);
// Images bucket: none yet (recipes ship no photos). When photos land, add a per-image budget
// here so an un-optimised upload is caught — tracked with the weight-first work (ADR-0008).
console.log('  (images: none shipped yet — bucket reserved for when recipe photos are added)');

if (failures.length) {
  console.error(`\nPERF BUDGET EXCEEDED: ${failures.length} route(s) over budget:`);
  for (const f of failures) console.error('  ✗ ' + f);
  console.error(
    'If the increase is legitimate, raise the specific budget in scripts/perf-budget.mjs and note why.',
  );
  process.exit(1);
}
console.log('\nPERF BUDGET PASSED: every route within its raw-byte / DOM budget.');

function sharedJsFiles() {
  return existsSync('dist/_astro')
    ? readdirSync('dist/_astro').filter((f) => f.endsWith('.js'))
    : [];
}
function sharedJsBytes() {
  return sharedJsFiles().reduce((s, f) => s + bytes(`dist/_astro/${f}`), 0);
}
function sharedJsGz() {
  return sharedJsFiles().reduce((s, f) => s + gz(`dist/_astro/${f}`), 0);
}
