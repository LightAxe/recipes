# Plan: Phase 1 — scaffold the Ogilvie Family Recipes site (thin vertical slice)
_Locked via grill — by Claude + Rob. Hardened via Codex (round 1)._

## Goal
Stand up the Astro site as a **thin vertical slice** that proves the whole content→page
pipeline end-to-end, in the Enamelware design language, without any of the recipe/cooking
interactivity or launch machinery. When Phase 1 is done: `npm run build` + `astro check`
pass and a **post-build smoke test** is green; the repo-root `recipes/` content is read via
a glob loader and validated by a full Zod schema; the `grandmas-apple-pie` recipe renders
as a clean **semantic** page (with an optimized placeholder hero image) in both light and
dark themes; `/` and `/recipes/` list recipes; the base layout carries the wordmark, a
**live-routes-only** nav, the theme toggle, and the "axpr cinematic universe" footer; and
CI build-checks every push/PR. **Phase 1 output is non-public scaffolding** (not deployed,
`noindex`) — so deferring JSON-LD does not violate ADR-0004, which governs the *public*
site. Lands on a `phase-1-scaffold` branch via PR.

## Approach

### 1. Branch & minimal scaffold (just enough to build)
1. Create branch `phase-1-scaffold`.
2. Scaffold **Astro 6** (TypeScript, strict) with **npm**; pin **Node ≥22.12** via
   `.nvmrc` (`22`) and `package.json` `engines`. Match sibling versions (Astro 6.1.x).
   Set **`trailingSlash: 'always'`** + `build.format: 'directory'` in `astro.config.mjs`
   (IA requires stable trailing-slash URLs).
3. Add **Tailwind CSS 4** via the **`@tailwindcss/vite`** plugin (not legacy
   `@astrojs/tailwind`), wired in `astro.config.mjs`. Self-host fonts via `@fontsource`:
   **Fredoka** (display), **Atkinson Hyperlegible** (body/UI), **DM Mono** (meta).
4. Tooling: `astro/tsconfigs/strict`, **Prettier** + `prettier-plugin-astro`, npm scripts
   (`dev`, `build`, `preview`, `check`, `format`, `smoke`). Brief root `README.md` → `AGENTS.md`/`docs/`.

### 2. Spike — de-risk the external-content image pipeline (against the scaffold)
5. Before building components, a tiny **spike** on the scaffold proves the core unknown: a
   `glob()` loader with `base` = repo-root `recipes/` + the content **`image()`** schema
   helper + **`<Picture>`** produce optimized output for an entry whose images are colocated
   under `recipes/images/<slug>/`. Also confirm Fredoka's `@fontsource` axes here. If
   `image()` can't resolve images for an externally-based collection, pick the fallback
   **now** (relative `import`, an `assets/` symlink, or a plain-string path optimized via a
   small step) before writing the rest.

### 2. Design tokens (Enamelware, both themes) — Tailwind v4 correctly
7. `src/styles/global.css`: `@import "tailwindcss"`. Put **static brand scale tokens in a
   top-level `@theme`** block (fonts, radii, the fixed palette) — `@theme` must be
   top-level, never nested. Put **runtime-themeable values as plain CSS custom properties**
   under `:root` (Counter/light) and override them under `[data-theme="dark"]` **and**
   `@media (prefers-color-scheme: dark) { :root:not([data-theme]) { … } }` (Night Kitchen).
   Fluid base size per `docs/design.md` §3: `:root { font-size: clamp(18px, 1rem + 0.25vw, 20px); }`
   (the inline sum is valid inside `clamp()`; keep design.md's exact form).
8. **Theme plumbing:** a tiny **pre-paint inline `<head>` script** sets `data-theme` from
   `localStorage` → `prefers-color-scheme` (no flash). The CSS `@media` fallback in step 7
   means **no-JS users still get their system theme**; the `ThemeToggle` button is
   **hidden when JS is unavailable** (rendered/enabled by the script) and persists choice.

### 3. Content pipeline
9. `src/content.config.ts`: a `recipes` collection via a **`glob()` loader**, `base` =
   repo-root `recipes/`, pattern matching recipe `.md` **excluding `TEMPLATE.md`** and
   `images/` (verify the loader's negation/micromatch; relocate the template if needed).
10. A **Zod schema that fully mirrors `docs/recipe-schema.md`** (every field): `title`,
    `description`, `contributor` (req); `course` = **enum of the 13 taxonomy slugs**;
    optional `cuisine`; `tags[]` validated **kebab-case** (regex); optional `image`
    `{src: image(), alt}`; **`servings` = `z.number().int().positive()`** (no zero/negative
    — the scaler divides by it); optional `yield`; ISO-8601 `prepTime/cookTime/totalTime`;
    `ingredients[]` (**`qty?` single number** — see range note, `unit?`, `item` req, `prep?`,
    **`note?`**, `grams?`, `gramsApprox?` bool, `gramsSource?`, `section?`); `instructions[]`
    = **union `string | {text, section?, timer?}`**; optional `notes[]`, `nutrition`,
    `datePublished/dateUpdated`. (Soft taxonomy passes — cuisine-not-in-list *warning* and
    new-tag *note* — are deferred to a later phase; the hard enum + kebab regex ship now.)
    **Quantity ranges** ("2–3 apples") are **deferred for v1**: `qty` is a single number;
    express a range in `note`/`prep` text for now. Reconcile `docs/scaling-and-units.md` §8
    (which mentions scaling ranges) to mark range-typed `qty` as a future schema change.
11. **Fix the fixture** so it's a clean, schema-valid exemplar: remove the `dessert` tag
    from `grandmas-apple-pie.md` (taxonomy forbids duplicating the course as a tag); update
    the hero `alt` to honestly match the placeholder (see step 13). Confirm it validates
    (it exercises the **instructions union/timer branch**, the course enum, sectioned
    *ingredients*, and the grams fields — it does **not** exercise sectioned *instructions*;
    no claim is made that it does).

### 4. Placeholder hero image (astro:assets via `<Picture>`)
12. Generate an **EXIF-clean placeholder** `hero.jpg` **once and commit it as a static
    asset** (no reliance on a transitive `sharp`; astro:assets bundles sharp to *optimize*
    it at build). Place at `recipes/images/grandmas-apple-pie/hero.jpg`; set the recipe's
    `image.src` to the **colocated relative path** `./images/grandmas-apple-pie/hero.jpg`
    and update the `image.src` relative-path convention in `docs/recipe-schema.md`,
    `recipes/TEMPLATE.md`, **and `docs/agents/intake.md`** (which currently says to
    reference only the filename) in the same step.
13. Render via the content **`image()`** helper + **`<Picture formats={['avif','webp']}
    widths={…} sizes="…">`** (multi-format/responsive — `<Image>` alone is single-format).
    Because the placeholder is a motif, its `alt` describes **what it actually is**
    ("Placeholder — a cream enamel tile with a petal motif; photo coming soon"), not a pie;
    a real photo + real alt arrive via intake later.

### 5. Layout, components, pages
14. `src/layouts/Base.astro`: `<head>` (meta, fonts, pre-paint theme script, title,
    **`<meta name="robots" content="noindex">`** while non-public, **no `canonical`/OG
    until `site` is configured**), a **skip-to-content** link, `<Header>`, `<main id="main">`,
    `<Footer>`.
15. Components: `Wordmark` ("Ogilvie Family Recipes" + petal mark), `Header` (wordmark +
    **nav with only live routes — `Recipes` (/recipes/) — plus `ThemeToggle`**; no
    Categories/Tips/About/Search yet), `Footer` (© Ogilvie Family + **"Part of the
    [axpr](https://axpr.net) cinematic universe"**), `RecipeCard` (thumb + title + mono
    meta, whole-card link), **`CardGrid`** (the responsive grid wrapping `RecipeCard`s),
    `Petal` SVG. **`image` is optional in the schema, so `RecipeCard` and the recipe page
    both guard rendering** — a recipe with no `image` shows a tasteful petal/tile fallback,
    never a broken `<picture>`.
16. Pages (all under `trailingSlash:'always'`):
    - `src/pages/index.astro` — title + one-line intro + a `CardGrid` linking to `/recipes/`.
    - `src/pages/recipes/index.astro` — **All Recipes**: `CardGrid` of `RecipeCard`s from
      `getCollection('recipes')` (this is the nav target; prevents a dead link).
    - `src/pages/recipes/[...slug].astro` — `getStaticPaths` over recipes; the **semantic
      backbone** styled with base tokens: `<Picture>` hero, title (Fredoka), meta byline
      (DM Mono: contributor, times, servings), petal-bulleted ingredient list at **base
      amounts** (grouped by `section`, showing `note`/`prep`), numbered steps (enamel-circle
      badges; a step's `timer` as plain text), `notes` callout, Markdown **story body** in a
      `<details>` disclosure. No JSON-LD/interactivity/print.
    - `src/pages/404.astro` — simple themed not-found.

### 6. CI (build-check + smoke test)
17. `.github/workflows/ci.yml`: on push/PR → Node 22, `npm ci`, `npx astro check`,
    `npm run build`, then **`npm run smoke`** — a tiny post-build script asserting `dist/`
    contains `index.html`, `recipes/index.html`, `recipes/grandmas-apple-pie/index.html`,
    the recipe title text, and **optimized image markup** (`<picture>` + an `.avif`/`.webp`
    source). Catches dead routes, missing image formats, and broken renders that
    `astro check` won't. **No deploy, no analytics.**

### 7. Verify & land
18. Verify locally: spike green, `astro check` clean, `npm run build` + `npm run smoke`
    pass, apple-pie renders with the optimized image, both themes work with **no FOUC**,
    no-JS page is fully readable and system-themed, `/` and `/recipes/` list the recipe.
    Open a **PR** from `phase-1-scaffold`; CI green; Rob reviews/merges.

## Key decisions & tradeoffs (resolved in grill + round-1 hardening — bite here, Codex)
- **Thin vertical slice** DoD; **spike-first** to de-risk external-content `image()` before
  committing to it.
- **Glob loader OUTSIDE `src/`** at repo-root `recipes/` (ADR-0002 decoupling). Tradeoff:
  `image()` resolution + `TEMPLATE.md` exclusion must work — the spike proves or replaces it.
- **Image pipeline + a committed placeholder** in Phase 1; rendered via **`<Picture>`**
  (multi-format), not `<Image>`; placeholder `alt` is honest.
- **Tailwind v4 done right:** static tokens in top-level `@theme`; **runtime theme values as
  CSS custom properties** under `:root`/`[data-theme]`/`@media` (not nested in `@theme`).
- **Both themes with a no-JS CSS `prefers-color-scheme` fallback**; toggle hidden without JS.
- **Full Zod schema** incl. `ingredients[].note`, the instructions union, the 13-slug enum,
  and **kebab-case tag regex**; soft cuisine/new-tag *warnings* deferred (documented).
- **`trailingSlash:'always'`**, **live-routes-only nav** (+ a real `/recipes/` page),
  **`noindex` + no canonical** while non-public.
- **JSON-LD stays deferred** (Rob's explicit grill choice) — the ADR-0004 tension is
  resolved by **scoping Phase 1 as non-public/`noindex` scaffolding**; JSON-LD lands in
  Phase 2 *before* launch, which is what ADR-0004 actually governs.
- **CI build-check + smoke test**; **npm + Node 22**; defer deploy/analytics/domain;
  **feature branch + PR**.

## Risks / open questions
- **`image()` with an external glob `base`** — the **spike (step 1)** resolves this up
  front; fallback chosen there if it fails. *(Was the top risk; now gated by the spike.)*
- **`@fontsource` Fredoka** packaging (variable vs static axes) — confirm in the spike.
- **`@tailwindcss/vite` + Astro 6** version compatibility — confirm at scaffold.
- **glob `TEMPLATE.md` exclusion** — confirm the loader's negation pattern, else relocate
  the template out of `recipes/`.
- **Smoke-test brittleness** — keep assertions structural (file exists, `<picture>`/`.avif`
  present, title substring), not hashed asset names.

## Out of scope (Phases 2–4)
All **recipe/cooking interactivity** (serving scaler, US/metric + volume/**weight** toggle,
tap-to-check, cook mode + wake lock, timers) — the JS **theme toggle is in scope** and is
not "interactivity" in this sense; schema.org **JSON-LD** (Phase 2, before launch);
**print**/4×6 stylesheet; taxonomy / cuisine / tag / **contributor** pages; **Pagefind**
search; **tips**/**about** pages; full enamel-dish **card polish** beyond a basic petal;
**deploy** (S3 + CloudFront + Route 53 + OIDC), **Cloudflare Analytics**, the **domain**,
and a real `site`/canonical/OG; **Vitest** + the pure scaling-units lib.
