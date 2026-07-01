// Live-site preflight + content-encoding check for the weekly perf monitor. Reliable and
// dependency-free (plain fetch), so it's testable locally unlike headless Lighthouse.
//
// Because the site is SUPPOSED to be live (SITE_LIVE=true), production coming back unreachable
// or noindex is a LAUNCH REGRESSION, not a reason to skip — this exits non-zero so the workflow
// opens/updates the tracking issue. It only stands down when explicitly told it's a staged
// context (STAGED=1). It also verifies CloudFront is actually serving Brotli/gzip, which is what
// makes the per-PR raw-byte budgets conservative (users download the compressed payload).
const SITE = (process.env.MONITOR_SITE || 'https://recipes.axpr.net').replace(/\/$/, '');
const STAGED = process.env.STAGED === '1';
const problems = [];
const notes = [];

async function main() {
  // 1. Reachable?
  let robots;
  try {
    robots = await fetch(`${SITE}/robots.txt`);
  } catch (e) {
    problems.push(`site unreachable: ${SITE}/robots.txt — ${e.message}`);
    return;
  }
  if (!robots.ok) {
    problems.push(`robots.txt returned HTTP ${robots.status}`);
    return;
  }
  const robotsTxt = await robots.text();
  const allows = /Allow:\s*\//i.test(robotsTxt);
  const advertisesSitemap = /Sitemap:/i.test(robotsTxt);

  // 2. Indexable (only enforced when we expect to be live)?
  let recipeNoindex = false;
  try {
    const rec = await fetch(`${SITE}/recipes/snickerdoodles/`);
    recipeNoindex = /name="robots"[^>]*noindex/i.test(await rec.text());
  } catch (e) {
    problems.push(`could not fetch a recipe page — ${e.message}`);
  }
  if (STAGED) {
    notes.push('STAGED=1 — skipping the indexable assertion');
  } else if (!allows || !advertisesSitemap || recipeNoindex) {
    problems.push(
      `production is not indexable (allows=${allows}, sitemap=${advertisesSitemap}, ` +
        `recipe noindex=${recipeNoindex}) — a live site going dark is a regression`,
    );
  }

  // 3. Content-encoding: CloudFront must serve Brotli/gzip for the main asset types.
  for (const path of ['/', '/recipes/snickerdoodles/', '/pagefind/pagefind.js']) {
    try {
      const r = await fetch(`${SITE}${path}`, { headers: { 'Accept-Encoding': 'br, gzip' } });
      const enc = (r.headers.get('content-encoding') || '').toLowerCase();
      if (enc === 'br' || enc === 'gzip') notes.push(`${path} → ${enc}`);
      else problems.push(`${path} not compressed (content-encoding: ${enc || 'identity'})`);
    } catch (e) {
      problems.push(`could not fetch ${path} — ${e.message}`);
    }
  }
}

await main();
console.log(`live-perf-check: ${SITE}`);
for (const n of notes) console.log(`  · ${n}`);
if (problems.length) {
  console.error(`\nLIVE CHECK FAILED: ${problems.length} problem(s):`);
  for (const p of problems) console.error('  ✗ ' + p);
  process.exit(1);
}
console.log('\nLIVE CHECK PASSED: reachable, indexable, and served compressed (br/gzip).');
