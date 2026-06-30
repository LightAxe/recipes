# Plan: Phase 2 — complete the recipe (SEO + print) and add the interactive layer
_Locked via grill — by Claude + Rob. Hardened via Codex (round 1)._

## Goal
Turn the static Counter recipe page into a complete, launch-ready, interactive one — while
staying **staged** (not deployed, not indexable) until real recipes are imported. Add the
build-time SEO/structured-data + print layer and the client interactive layer (serving
scaler, US/metric + volume/weight toggle, tap-to-check, lightweight cook mode), all as
**progressive enhancement** over the existing semantic page (no-JS unchanged). The
correctness-critical scaling/unit math is a pure, **Vitest-tested** lib. Lands on
`phase-2-recipe-interactivity` → PR → CI (now incl. tests) → merge.

## Approach

### 1. Branch, deps, indexability gate
1. Branch `phase-2-recipe-interactivity` off `main` (done).
2. Add dev dep **vitest**; add **@astrojs/sitemap** + **@astrojs/rss** (versions compatible with Astro ~6.1).
3. Set `site: 'https://recipes.axpr.net'` in `astro.config.mjs` (keep `trailingSlash:'always'`).
4. **One launch gate** — an env flag `SITE_LIVE` (default `false`). While `false` (staged):
   `<meta name="robots" content="noindex">` on every page and the sitemap is **not advertised**
   (no `<link rel="sitemap">`, not referenced in robots). **No `robots.txt Disallow: /`** — a
   Disallow would block crawlers *before* they could read the `noindex` (Codex R2 #5), and Phase 2
   doesn't deploy anyway; if a pre-launch build is ever deployed, protect it at the **CDN/auth**,
   not via robots. At launch we flip the one flag — avoids publishing crawl URLs while telling
   crawlers to drop every page (Codex #4).

### 2. Pure scaling/units lib + tests (foundation)
5. `src/lib/units.ts` — conversion constants, **unit normalization** (map `tablespoon`/`T`/`tbsp.`/
   plurals → canonical; a known-unit set), volume↔metric, grams↔oz/lb/kg, and an **explicit
   promotion threshold table** (e.g. 4 tbsp→¼ cup, 1000 g→1 kg) replacing the vague "largest unit ≥1"
   prose (Codex #12). `src/lib/scaling.ts` — factor, scale qty+grams. **No DOM imports.**
6. **Vitest** suite, two kinds kept separate (Codex #13): **raw-conversion round-trips** (within
   tolerance, e.g. cup↔ml, g↔oz) AND **display-format snapshots** (fraction snapping, promotion,
   `900 g → 2 lb`, egg/half-count, tiny-amount flooring, factor clamping, ×1 idempotence, grams-absent
   fallback). Add `test` script + `npm test` to `.github/workflows/ci.yml`.
7. Tighten `src/content.config.ts`: **whitelist** `nutrition` keys to schema.org
   `NutritionInformation` fields (Codex #10). Unknown **units** aren't a Zod concern (Zod is
   pass/fail, not warning-capable — Codex R2 #2): add a separate **`scripts/validate-content.mjs`**
   that logs **warnings** for unknown units (and, per `taxonomy.md` soft rules, unknown cuisine /
   brand-new tags) and runs in CI. `units.ts` still normalizes synonyms (`tablespoon`/`T`/plurals)
   so the scaler never silently mishandles them (Codex #14).

### 3. Recipe page: progressive-enhancement markup
8. Server-render ingredient quantities with base-value data attributes (`data-qty`, `data-unit`,
   `data-grams`, `data-grams-approx`, `data-count`) + visible base text. Ingredients & steps use
   **native `<input type=checkbox>` + `<label>`** for tap-to-check (≥44px, strike-through when
   done) — **not** `aria-pressed` (Codex #15). No-JS = base amounts + a plain, still-checkable list.
9. **Enhancement controls are hidden until JS initializes** (rendered `hidden`, revealed by script,
   like the theme toggle) so the no-JS path shows only static base servings (Codex #16): **Scaler**
   (`1× 2× 3×` `radiogroup` + editable servings) and **Unit toggles** (System US⇄Metric, Measure
   Volume⇄Weight, `aria-pressed`).
10. **Weight-toggle gating, defined precisely:** denominator = ingredients that are *measurable*
    (have a numeric `qty` **or** `grams`); coverage = those with `grams`. Show Weight when coverage
    ≥ 60%. Apple-pie: measurable = apples, sugar, flour, cinnamon, nutmeg, crusts (6); with grams =
    apples, sugar, flour, cinnamon (4) → 67% ✓. Count+grams items (apples) render by weight in
    weight view. **Fallback in weight view (Codex R2 #1):** an item with `unit`+`qty` but no grams
    shows `≈ <its volume>` (muted); a **count** item with no grams (e.g. pie crusts) stays a **plain
    count, unchanged** (there's no volume to show). A persisted **"prefer weight"** preference
    defaults a well-covered recipe to weight.
11. **Lightweight cook mode:** enlarges step text, dims chrome, engages **Screen Wake Lock**. Status
    ("screen will stay on") shows **only after a live sentinel is acquired**; handle unsupported /
    rejected / auto-released states gracefully and re-acquire on `visibilitychange` (Codex #19).
    No-JS: button hidden.
12. **Timers are display-only** — a step's `timer` renders as plain informational text, no countdown.

### 4. Interactivity scripts (vanilla TS) + state
13. `src/scripts/`: `prefs.ts` (localStorage + URL), `scaler.ts`, `unitToggle.ts`, `checklist.ts`,
    `cookmode.ts`. They read data attributes, call the pure lib, rewrite only number/unit spans +
    control state. Hydrated per recipe page.
14. **State model (single precedence rule, Codex #17/#18):** the URL param is **`?servings=N`**
    (absolute target servings; the `1×/2×/3×` presets just set `servings = base × preset`; factor =
    `servings / base`, clamped). Serving scale resolves: **`?servings=` if present → else per-recipe
    stored scale → else base (1×)**. Unit system + measure + "prefer weight" → localStorage (global).
    tap-to-check → localStorage keyed by recipe slug.

### 5. Structured data (SEO), gated
15. Extend `Base.astro` first: a typed **`jsonLd` prop** (rendered as `<script type="application/ld+json">`),
    a **head `<slot name="head">`**, `<link rel="canonical">`, and RSS autodiscovery (Codex #5).
16. `src/lib/jsonld.ts` builds **schema.org Recipe**: name, **image as an absolute optimized URL**
    (`getImage` + `new URL(..., site)`, Codex #6), author=contributor, prep/cook/total, recipeYield,
    **`recipeIngredient` = clean as-authored strings only** (qty/unit/item/prep — *no* grams,
    source, or approx markup; Codex #7), **`recipeInstructions` = clean `HowToStep{text}`** with no
    "Step N" prefixes and `url` only if `id="step-n"` anchors exist (Codex #8), recipeCategory=course
    label, recipeCuisine, keywords=tags, **`suitableForDiet` only for accurate mappings** (drop
    `low-sugar`→LowCalorieDiet; Codex #9), nutrition only if present (whitelisted). Add
    **BreadcrumbList** on recipe pages, **ItemList** on `/recipes/` + home, **WebSite** site-wide.
17. **RSS endpoint** at `src/pages/rss.xml.ts` using `@astrojs/rss` — full metadata (Codex R2 #4):
    feed `title` + `description` + `site`, and each item `title`, `link`, `pubDate` (from
    `datePublished`), `description` (Codex #2).
    **Sitemap** via `@astrojs/sitemap` — its real output is **`sitemap-index.xml` + `sitemap-0.xml`**
    (not `/sitemap.xml`); update the IA doc + smoke accordingly (Codex #1). Both gated by `SITE_LIVE`.
18. **Validation:** validate rendered JSON-LD **locally now** (paste into the Schema Markup
    Validator / JSON-parse in tests); the Google **URL** Rich Results Test only works post-launch
    (needs non-`noindex`), so it's a launch-checklist item, not a Phase-2 gate (Codex #3).

### 6. Print — three modes, clean by default
19. **`@media print` defaults to CLEAN** (no chrome, no photo): nav/footer/toggles/cook-mode/buttons
    **and the tap-to-check checkboxes** hidden, and checked-state **strikethrough/dimming
    neutralized** so a printed copy reads normally — while **preserving the scaled/unit text**
    (Codex R2 #6); keep title/meta/ingredients/method/notes. A plain Ctrl+P is already clean (Codex #22).
20. A small **Print menu** offers: **Clean** (default), **Full** (adds the hero via a `print-full`
    body class), and **4×6 card**. For 4×6, body classes can't reliably drive `@page size`
    (Codex #20), so the script **enables a dedicated `media="print"` stylesheet** (`@page { size: 4in
    6in; margin: .3in }` + compact card CSS) immediately before `window.print()` and disables it
    after. **Card mode allows multi-page flow** for long recipes (not forced onto one card); verify
    with a long recipe (Codex #21). Printed output reflects the **current scale/units** (DOM-based).

### 7. Quality, docs, land
21. Extend `scripts/smoke.mjs` to **parse, not just grep** (Codex #23): `JSON.parse` the Recipe
    JSON-LD block and assert key fields; assert the **RSS** endpoint output and the **exact sitemap
    filenames** exist (when `SITE_LIVE`); assert the clean-print marker. **CI runs build + smoke
    twice — default (staged) and `SITE_LIVE=true`** — so the launch-only sitemap/RSS/robots outputs
    can't rot untested (Codex R2 #3). Keep `astro check` + build + smoke + **test** + the
    content-validation script green in CI.
22. **Doc fixes (do these so docs match reality):** `architecture.md` — correct the stale "Tailwind
    via `@tailwindcss/vite`" line to PostCSS (ADR-0009 conflict, Codex #24); **scrub interactive-timer
    references** in `recipe-schema.md`, `components.md`, `architecture.md`, `AGENTS.md` → display-only
    (Codex #25); `taxonomy.md` — drop the `low-sugar`→`LowCalorieDiet` mapping; `scaling-and-units.md`
    — replace the promotion prose with the threshold table; `design.md` — cook mode = lightweight,
    print = 3 modes; `information-architecture.md` — sitemap filename. Small ADR for the `SITE_LIVE`
    staged-launch gate.
23. Verify locally (both themes, no-JS path, scaled + weight-view print in all 3 modes), open PR, CI
    green, merge.

## Key decisions & tradeoffs (resolved in grill + round-1 hardening — bite here, Codex)
- **Big Phase 2:** SEO + print + full interactivity, **minus timers** (display-only).
- **Domain `recipes.axpr.net`** as `site`, but **staged behind a single `SITE_LIVE` gate** that ties
  together noindex + robots + sitemap advertisement (no half-published crawl directives).
- **JSON-LD correctness:** clean `recipeIngredient`/`recipeInstructions`, absolute image URL,
  accurate `suitableForDiet` only, whitelisted nutrition; validate locally (URL test post-launch).
- **Cook mode = lightweight** wake-lock with status only after a real sentinel.
- **State:** URL **`?servings=`** (single semantics) with precedence URL → stored → base; prefs +
  checks in localStorage.
- **Print:** clean by default; Full/4×6 are explicit; 4×6 via a toggled dedicated print stylesheet
  (not body-class `@page`), multi-page allowed.
- **Checklist = native checkboxes**; controls **hidden until JS**; pure **Vitest-tested** lib with
  raw round-trips separated from display snapshots.

## Risks / open questions
- **`@page size` browser support** for the 4×6 card is uneven — verify in real browsers; the
  toggled-stylesheet approach is the most reliable but not universal.
- **Wake Lock** availability varies (HTTPS only, can be denied/auto-released) — UI must degrade.
- **@astrojs/sitemap / @astrojs/rss** compatibility with Astro ~6.1 — confirm at install.
- **`SITE_LIVE` discipline** — every indexability surface (meta, robots, sitemap link) must read the
  one flag, or staging leaks.
- **Weight fallback** for grams-less items must render clearly: nutmeg (unit+qty) → `≈ volume`;
  crusts (count) → count unchanged.

## Out of scope (later phases)
Taxonomy/cuisine/tag/**contributor** browse pages; **Pagefind** search; **tips**/**about** pages;
**deploy** (S3/CloudFront/Route 53/OIDC) + flipping `SITE_LIVE` at go-live; **heritage** features;
**interactive timers**.
