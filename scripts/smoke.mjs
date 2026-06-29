// Post-build smoke test: assert the key routes exist and rendered correctly.
// Catches dead routes, missing image formats, and broken renders that `astro check`
// won't. Structural assertions only (no hashed asset names). Run: node scripts/smoke.mjs
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const checks = [];
const ok = (name, cond) => checks.push({ name, pass: !!cond });
const read = async (f) => (existsSync(f) ? readFile(f, 'utf8') : '');

for (const f of [
  'dist/index.html',
  'dist/recipes/index.html',
  'dist/recipes/grandmas-apple-pie/index.html',
  'dist/404.html',
]) {
  ok(`route exists: ${f}`, existsSync(f));
}

const recipe = await read('dist/recipes/grandmas-apple-pie/index.html');
ok('recipe shows the title', recipe.includes('Grandma') && recipe.includes('Apple Pie'));
ok('recipe renders <picture>', recipe.includes('<picture'));
ok('recipe emits an AVIF source', recipe.includes('.avif'));
ok('recipe emits a WebP source', recipe.includes('.webp'));
ok('recipe carries the universe footer', recipe.includes('cinematic universe'));
ok('pages are noindex (non-public)', /name="robots"\s+content="noindex"/.test(recipe));

const home = await read('dist/index.html');
ok('home links to /recipes/', home.includes('/recipes/'));

const all = await read('dist/recipes/index.html');
ok('all-recipes lists the recipe', all.includes('/recipes/grandmas-apple-pie/'));

let failed = 0;
for (const c of checks) {
  if (!c.pass) failed++;
  console.log(`${c.pass ? '✓' : '✗'} ${c.name}`);
}
if (failed) {
  console.error(`\nSMOKE FAILED: ${failed}/${checks.length} check(s) failed`);
  process.exit(1);
}
console.log(`\nSMOKE PASSED: ${checks.length} checks`);
