# Plan Review Log: Phase 2 — recipe completion + interactivity

Act 1 (grill) complete — plan locked with the user. MAX_ROUNDS=5.

Grill resolved: big Phase 2 (SEO + print + full interactivity); domain = recipes.axpr.net
set as `site` but **stay staged** (noindex, no deploy); cook mode = lightweight stay-awake
(no navigator); **no interactive timers** (display-only durations); persistence = prefs in
localStorage + scale in URL `?x=` + checks per-recipe; print = 3 modes (clean / full-with-
photo / 4×6-no-photo); Vitest for the scaling/units lib, wired into CI; OUT = browse/search/
tips/deploy/heritage. Branch `phase-2-recipe-interactivity` → PR.

## Round 1 — Codex

**Findings**
- [PLAN.md](/Users/rob/dev/recipes/PLAN.md:60) treats sitemap as “wired” but Astro’s sitemap integration defaults to `sitemap-index.xml` + `sitemap-0.xml`, while docs/IA names `/sitemap.xml`; fix: configure `filenameBase` or update docs/tests to assert the real output. Source: Astro sitemap docs.
- [PLAN.md](/Users/rob/dev/recipes/PLAN.md:60) implies `@astrojs/rss` emits `/rss.xml`; it does not, it requires a `src/pages/rss.xml.{js,ts}` endpoint; fix: add the endpoint with `rss({ site: context.site, items })` and smoke-test it. Source: Astro RSS docs.
- [PLAN.md](/Users/rob/dev/recipes/PLAN.md:59) says “Validate with Google Rich Results before merge” while [Base.astro](/Users/rob/dev/recipes/src/layouts/Base.astro:35) keeps `noindex`; Google explicitly says rich-result URL testing requires pages not blocked by `noindex`; fix: validate rendered JSON-LD locally now, run URL Rich Results only after launch indexing is enabled. Source: Google recipe docs.
- [PLAN.md](/Users/rob/dev/recipes/PLAN.md:18) sets the production `site` while keeping global `noindex`; if this branch ever deploys, you publish canonical/sitemap/RSS URLs that tell crawlers where to crawl and then tell them to drop every page; fix: gate `robots`, sitemap discovery, and deploy/indexability behind an explicit launch env.
- [Base.astro](/Users/rob/dev/recipes/src/layouts/Base.astro:19) has no head slot/props for canonical, RSS autodiscovery, or JSON-LD; fix: extend `Base` with a typed head slot/`jsonLd` prop before implementing SEO.
- [PLAN.md](/Users/rob/dev/recipes/PLAN.md:54) handwaves image URLs for JSON-LD; content `image()` produces image metadata usable by `astro:assets`, but JSON-LD needs absolute crawlable URLs; fix: derive an optimized image URL with Astro image metadata/getImage and `new URL(..., site)`. Source: Astro images docs.
- [PLAN.md](/Users/rob/dev/recipes/PLAN.md:55) risks putting grams/sources/approx text into `recipeIngredient`; Google says ingredient markup should include only necessary ingredient text; fix: emit as-authored ingredient strings only, no gram provenance.
- [PLAN.md](/Users/rob/dev/recipes/PLAN.md:55) says `recipeInstructions as HowToStep` but current steps have no IDs and Google warns not to include “Step 1” text; fix: generate clean `{ "@type":"HowToStep", text }` and only add `url` if matching `id="step-n"` anchors exist. Source: Google recipe docs.
- [docs/taxonomy.md](/Users/rob/dev/recipes/docs/taxonomy.md:88) maps `low-sugar` to `LowCalorieDiet`, which is false structured data for many recipes; fix: do not emit `suitableForDiet` for `low-sugar` unless the recipe is actually low-calorie, or revise taxonomy. Source: schema.org RestrictedDiet.
- [src/content.config.ts](/Users/rob/dev/recipes/src/content.config.ts:79) allows arbitrary nutrition keys, so JSON-LD can emit invalid `NutritionInformation`; fix: whitelist schema.org nutrition fields and enforce `recipeYield` when per-serving nutrition exists.
- [PLAN.md](/Users/rob/dev/recipes/PLAN.md:36) says apple pie is 4/6 gram coverage, but [the sample](/Users/rob/dev/recipes/recipes/grandmas-apple-pie.md:17) has apples as count+grams and scaling docs say count+grams renders by weight; fix: define the denominator exactly and update the expected apple-pie coverage.
- [docs/scaling-and-units.md](/Users/rob/dev/recipes/docs/scaling-and-units.md:101) contradicts itself: `4 tbsp -> 1/4 cup` violates “largest unit that yields >= 1”; fix: replace the prose with an explicit promotion threshold table.
- [PLAN.md](/Users/rob/dev/recipes/PLAN.md:25) asks for “round-trip” tests through kitchen-rounded outputs; that will fail by design for values like `900 g -> 2 lb`; fix: test raw conversion round trips separately from display-format snapshots.
- [src/content.config.ts](/Users/rob/dev/recipes/src/content.config.ts:55) leaves `unit` as any string, so the scaler will silently mishandle `tablespoon`, `T`, plurals, or typos; fix: add unit normalization plus Zod validation or build warnings for unknown units.
- [PLAN.md](/Users/rob/dev/recipes/PLAN.md:32) says “real checkbox/aria-pressed”; those are different interaction models; fix: use native checkbox + label for checklist rows, no `aria-pressed`.
- [PLAN.md](/Users/rob/dev/recipes/PLAN.md:34) renders scaler/toggles as controls even though no-JS can’t use them; fix: hide enhancement controls until JS initializes, leaving only static base servings in the no-JS path.
- [PLAN.md](/Users/rob/dev/recipes/PLAN.md:49) says scale is both URL-state and “remembered,” then says load defaults to `1x` without URL; fix: choose one rule, e.g. URL `?x=` wins, else per-recipe stored scale, else `1`.
- [PLAN.md](/Users/rob/dev/recipes/PLAN.md:50) uses `?x=` but also has editable serving count; fix: define `x` as a clamped multiplier decimal or use `?servings=`, not both semantics.
- [PLAN.md](/Users/rob/dev/recipes/PLAN.md:40) promises “screen stays on” as a note, but Wake Lock can be unsupported, rejected, or released by battery/visibility state; fix: show status only after a live sentinel is acquired and handle rejection/release UI. Source: MDN Wake Lock.
- [PLAN.md](/Users/rob/dev/recipes/PLAN.md:65) assumes body classes can cleanly switch `@page { size: 4in 6in }`; `@page` is not scoped by normal body selectors and browser support is uneven; fix: use a dedicated print-card route or enable a dedicated print stylesheet before `window.print()`. Source: MDN `@page size`.
- [PLAN.md](/Users/rob/dev/recipes/PLAN.md:66) says 4x6 keeps title, meta, ingredients, method, and notes; many real recipes will overflow a single index card; fix: define card mode as paginated cards or a summary card, then test long recipes.
- [PLAN.md](/Users/rob/dev/recipes/PLAN.md:68) says default browser print is clean, but class-keyed modes alone won’t make default print clean; fix: make `@media print` default to clean and let full/card be explicit overrides.
- [PLAN.md](/Users/rob/dev/recipes/PLAN.md:71) adds only shallow smoke assertions; it won’t catch malformed JSON-LD, bad RSS, missing sitemap files, or broken print CSS; fix: parse built JSON-LD/RSS/XML in smoke and assert exact sitemap/rss filenames.
- [docs/architecture.md](/Users/rob/dev/recipes/docs/architecture.md:46) still says Tailwind via `@tailwindcss/vite`, conflicting with [ADR 0009](/Users/rob/dev/recipes/docs/adr/0009-tailwind-v4-via-postcss.md:3) and [astro.config.mjs](/Users/rob/dev/recipes/astro.config.mjs:4); fix: update architecture before implementation so nobody reintroduces the Vite plugin.
- Timer scope is inconsistent: [PLAN.md](/Users/rob/dev/recipes/PLAN.md:42) says display-only, but [recipe-schema.md](/Users/rob/dev/recipes/docs/recipe-schema.md:75), [components.md](/Users/rob/dev/recipes/docs/components.md:140), [architecture.md](/Users/rob/dev/recipes/docs/architecture.md:105), and [AGENTS.md](/Users/rob/dev/recipes/AGENTS.md:86) still require tappable timers; fix: update all timer references or keep interactive timers in scope.

VERDICT: REVISE
### Claude's response (round 1)

Accepted ALL 24 findings (no rejections) and revised PLAN.md:
- SEO: added a single `SITE_LIVE` gate tying noindex + robots + sitemap advertisement together;
  Base.astro gains a jsonLd prop + head slot + canonical + RSS autodiscovery; JSON-LD image as
  absolute optimized URL (getImage + new URL); clean recipeIngredient (no grams) and clean
  HowToStep (no "Step N"); suitableForDiet only accurate (drop low-sugar mapping); whitelist
  nutrition; sitemap real filenames (sitemap-index.xml); RSS via src/pages/rss.xml.ts endpoint;
  validate JSON-LD locally now (URL Rich Results is a post-launch item).
- Interactivity: checklist = native checkboxes (not aria-pressed); controls hidden until JS;
  single state rule with URL `?servings=` (precedence URL → stored → base); wake-lock status only
  after a live sentinel with graceful degradation; weight-gating denominator defined exactly.
- Lib/tests: unit normalization + known-unit set + Zod warn; explicit promotion threshold table;
  Vitest splits raw-conversion round-trips from display-format snapshots.
- Print: @media print defaults to CLEAN; Full/4×6 explicit; 4×6 via a toggled dedicated print
  stylesheet (not body-class @page), multi-page allowed; verify long recipe.
- Smoke parses JSON-LD/RSS/sitemap (not just greps).
- Doc fixes enumerated: architecture Tailwind line (ADR-0009), scrub interactive-timer refs across
  4 docs, taxonomy low-sugar mapping, scaling-and-units promotion table, design cook-mode/print, IA
  sitemap filename; + a small ADR for the SITE_LIVE gate.

No findings rejected.

## Round 2 — Codex

Prior findings are mostly addressed at the plan level, but I would not approve it yet. Remaining/new issues:

- [PLAN.md](/Users/rob/dev/recipes/PLAN.md:47) still mishandles grams-less count items: it says measurable items lacking grams show “their volume,” but `pie crusts` has count/no unit, so there is no volume to show. Fix: define fallback as `unit+qty no grams -> ≈ volume`; `count no grams -> count unchanged`.

- [PLAN.md](/Users/rob/dev/recipes/PLAN.md:34) asks `content.config.ts` for build warnings on unknown units, but Zod/Astro schema validation is pass/fail, not warning-capable. Fix: either hard-fail unknown canonical units or add a separate validation script that logs warnings and runs in CI.

- [PLAN.md](/Users/rob/dev/recipes/PLAN.md:82) gates RSS/sitemap behind `SITE_LIVE`, but [CI](/Users/rob/dev/recipes/.github/workflows/ci.yml:18) only runs the default build, so launch-only outputs can rot untested. Fix: add a second CI/smoke pass with `SITE_LIVE=true`.

- [PLAN.md](/Users/rob/dev/recipes/PLAN.md:80) underspecifies RSS as `rss({ site, items })`; that omits required feed metadata and item shape. Fix: specify `title`, `description`, `site`, and item `title/link/pubDate/description`.

- [PLAN.md](/Users/rob/dev/recipes/PLAN.md:19) combines `noindex` with `robots.txt Disallow: /`; if a staged build is publicly reachable, crawlers may be blocked before seeing `noindex`. Fix: don’t deploy staging publicly, or protect it at CDN/auth; otherwise use `noindex` without `Disallow`.

- [PLAN.md](/Users/rob/dev/recipes/PLAN.md:88) print cleanup hides chrome/buttons but not checklist state. Fix: print CSS must hide checkbox controls and neutralize checked strikethrough/dimming while preserving scaled/unit text.

VERDICT: REVISE
### Claude's response (round 2)

Accepted all 6; revised PLAN.md:
- Weight fallback split precisely: unit+qty no grams → ≈ volume; count no grams → count unchanged.
- Unknown units → a separate scripts/validate-content.mjs (warnings, in CI), not Zod; units.ts normalizes synonyms.
- CI runs build+smoke twice: default (staged) and SITE_LIVE=true, so launch-only outputs are tested.
- RSS fully specified (feed title/description/site; item title/link/pubDate/description).
- Dropped robots.txt Disallow: / (would block crawlers before they see noindex); pre-launch deploys (if any) protected at CDN/auth.
- Print CSS hides checkboxes + neutralizes checked strikethrough/dimming while preserving scaled/unit text.

No findings rejected.

## Round 3 — Codex

Prior findings addressed: coherent launch gate, staged/live CI coverage, RSS/sitemap fixed,
JSON-LD cleaned, unit/count fallback resolved, print/checklist leakage fixed. One minor
non-blocker: a risk line lumped "crusts" with ≈vol (should be count-unchanged).

VERDICT: APPROVED

### Claude's response (round 3)
Fixed the risk-line nit (crusts → count unchanged). Converged in 3 rounds.
