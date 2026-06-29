# Plan Review Log: Phase 1 — scaffold the Ogilvie Family Recipes site

Act 1 (grill) complete — plan locked with the user. MAX_ROUNDS=5.

Grill resolved 9 branches: DoD = thin vertical slice; npm + Node 22; glob loader at
repo-root `recipes/`; placeholder image + astro:assets in Phase 1; full theme system
(both token sets + pre-paint script + toggle); CI build-check only (defer deploy +
analytics); defer all interactivity/JSON-LD/print/taxonomy/search; `astro check` +
Prettier, no Vitest yet; feature branch + PR.

## Round 1 — Codex

**Material Findings**

- [PLAN.md](/Users/rob/dev/recipes/PLAN.md:56) keeps `hero.jpg` under `recipes/images/<slug>/`, but [recipes/grandmas-apple-pie.md](/Users/rob/dev/recipes/recipes/grandmas-apple-pie.md:9) says `hero.jpg`; Astro content images resolve relative to the Markdown file’s folder, not a magic recipe image folder. Fix: use `./images/grandmas-apple-pie/hero.jpg` or build a custom resolver and update schema, template, and example together. 

- [PLAN.md](/Users/rob/dev/recipes/PLAN.md:57) claims `<Image>` gives “responsive AVIF/WebP”; Astro’s multi-format output is `<Picture>`, while `<Image>` is not that contract by default. Fix: use `<Picture formats={['avif','webp']} widths={...} sizes="...">` for hero/card images. 

- The plan’s external `recipes/` + `image()` risk is still a core DoD dependency, not an open question. Fix: make the first implementation step a tiny spike proving `glob({ base: './recipes' })` + `image()` + optimized output, then choose the fallback before building components.

- [PLAN.md](/Users/rob/dev/recipes/PLAN.md:30) implies Tailwind `@theme` plus dark overrides; Tailwind theme variables must be top-level, not nested under selectors/media. Fix: define generated utility tokens in top-level `@theme`, then use plain CSS custom properties under `:root`, `@media`, and `[data-theme="dark"]` for runtime theme values. 

- [PLAN.md](/Users/rob/dev/recipes/PLAN.md:33) has `clamp(18px,1rem+0.25vw,20px)`, which is invalid CSS math as written. Fix: use `clamp(18px, calc(1rem + 0.25vw), 20px)` or the spaced form from [docs/design.md](/Users/rob/dev/recipes/docs/design.md:109).

- No-JS dark mode is underspecified: [docs/architecture.md](/Users/rob/dev/recipes/docs/architecture.md:107) requires CSS `prefers-color-scheme` fallback, but [PLAN.md](/Users/rob/dev/recipes/PLAN.md:34) only mentions a script. Fix: add `@media (prefers-color-scheme: dark) { :root:not([data-theme]) ... }` and hide the toggle when JS is unavailable.

- The page set in [PLAN.md](/Users/rob/dev/recipes/PLAN.md:68) omits `/recipes/`, while IA makes `/recipes/` the All Recipes page and header nav target ([docs/information-architecture.md](/Users/rob/dev/recipes/docs/information-architecture.md:21), [docs/information-architecture.md](/Users/rob/dev/recipes/docs/information-architecture.md:85)). Fix: add `src/pages/recipes/index.astro` or do not link “Recipes” until it exists.

- Header/nav scope will create dead links if it follows [docs/components.md](/Users/rob/dev/recipes/docs/components.md:58) for Categories, Tips, About, and Search. Fix: Phase 1 nav should include only live routes, or add placeholder pages intentionally.

- IA requires trailing-slash stable URLs ([docs/information-architecture.md](/Users/rob/dev/recipes/docs/information-architecture.md:11)); the plan never configures Astro routing. Fix: set `trailingSlash: 'always'` in `astro.config.mjs`.

- [PLAN.md](/Users/rob/dev/recipes/PLAN.md:62) wants canonical URLs, but [PLAN.md](/Users/rob/dev/recipes/PLAN.md:102) says no domain yet. Fix: omit canonical until `site` is configured, or make `site` env-driven and fail production builds when absent.

- The promised “fully mirrors” schema misses `ingredients[].note` from [docs/recipe-schema.md](/Users/rob/dev/recipes/docs/recipe-schema.md:48). Fix: add `note?: string` and render it in IngredientItem.

- Taxonomy enforcement is incomplete: [docs/taxonomy.md](/Users/rob/dev/recipes/docs/taxonomy.md:127) requires cuisine warnings and kebab-case tag validation, but [PLAN.md](/Users/rob/dev/recipes/PLAN.md:45) only says `tags[]`. Fix: add tag regex validation and a build-time taxonomy warning pass.

- The current apple pie fixture violates the taxonomy rule against duplicating course as a tag: `course: dessert` plus `tags: [..., dessert, ...]` ([recipes/grandmas-apple-pie.md](/Users/rob/dev/recipes/recipes/grandmas-apple-pie.md:5), [docs/taxonomy.md](/Users/rob/dev/recipes/docs/taxonomy.md:74)). Fix: remove the `dessert` tag or explicitly downgrade that rule to a warning.

- [PLAN.md](/Users/rob/dev/recipes/PLAN.md:50) says apple pie exercises instruction sections, but it only exercises the object/timer branch ([recipes/grandmas-apple-pie.md](/Users/rob/dev/recipes/recipes/grandmas-apple-pie.md:55)). Fix: either add a sectioned instruction fixture or remove the claim.

- The placeholder image plan conflicts with its alt text: a “solid/petal motif” is not a “Golden lattice-topped apple pie” ([PLAN.md](/Users/rob/dev/recipes/PLAN.md:54), [recipes/grandmas-apple-pie.md](/Users/rob/dev/recipes/recipes/grandmas-apple-pie.md:10)). Fix: generate an actual apple-pie visual with matching alt, or make the motif decorative and do not use it as the recipe hero.

- [PLAN.md](/Users/rob/dev/recipes/PLAN.md:112) relies on `sharp` as a transitive dependency for image generation. Fix: declare `sharp` directly if repo scripts import it, or generate the placeholder outside repo tooling and commit the output.

- JSON-LD is pushed out of scope in [PLAN.md](/Users/rob/dev/recipes/PLAN.md:121), but accepted ADR 0004 says every recipe page emits Recipe JSON-LD ([docs/adr/0004-public-site-with-schema-org-json-ld.md](/Users/rob/dev/recipes/docs/adr/0004-public-site-with-schema-org-json-ld.md:3)) and architecture treats it as a derived output ([docs/architecture.md](/Users/rob/dev/recipes/docs/architecture.md:80)). Fix: include minimal Recipe JSON-LD now, or explicitly mark Phase 1 as non-public/non-indexable scaffolding.

- CI only runs `astro check` and build ([PLAN.md](/Users/rob/dev/recipes/PLAN.md:80)); that will not catch dead nav links, missing generated recipe route, wrong image format output, no-JS readability, or dark theme regressions. Fix: add a tiny post-build smoke test that asserts `/`, `/recipes/`, `/recipes/grandmas-apple-pie/`, title text, and optimized image markup exist.

- [PLAN.md](/Users/rob/dev/recipes/PLAN.md:7) says “No interactivity,” but includes a JS theme toggle. Fix: state “no recipe/cooking interactivity” so scope cannot be used to argue against required theme behavior.

VERDICT: REVISE
### Claude's response (round 1)

Accepted and applied (PLAN.md revised):
- hero image path → colocated relative `./images/grandmas-apple-pie/hero.jpg`; update schema/template/example.
- `<Picture>` (multi-format) instead of `<Image>` for hero/cards.
- Promoted the external-`recipes/` + `image()` risk to a **spike-first** step 0/1; fallback chosen there.
- Tailwind v4: static tokens in top-level `@theme`; runtime theme values as CSS custom props under `:root`/`[data-theme]`/`@media`.
- No-JS dark mode: added `@media (prefers-color-scheme: dark)` fallback; toggle hidden without JS.
- Added a real `/recipes/` All Recipes page (nav target) — no dead link.
- Live-routes-only nav (drop Categories/Tips/About/Search until they exist).
- `trailingSlash: 'always'` + `build.format: 'directory'`.
- Dropped canonical/OG until `site` exists; added `noindex` while non-public.
- Zod schema: added `ingredients[].note`; added kebab-case tag regex.
- Fixed fixture: remove duplicate `dessert` tag; corrected the over-claim about sectioned *instructions*.
- Placeholder `alt` made honest (decorative motif, not "apple pie"); real photo/alt later.
- Placeholder committed as a static asset (no reliance on transitive `sharp`; astro:assets optimizes it).
- CI: added a post-build **smoke test** (asserts key routes + `<picture>`/`.avif` markup).
- Reworded "no interactivity" → "no recipe/cooking interactivity" (theme toggle is in scope).

Adjusted / partially rejected (with reasons):
- **clamp "invalid CSS"** — technically incorrect: `clamp(18px, 1rem + 0.25vw, 20px)` is valid (math functions accept a calc-sum directly). Kept design.md's exact spaced form rather than wrapping in `calc()`; no functional change.
- **"include JSON-LD now"** — rejected the "now" fix in favor of Codex's *alternative*: Rob explicitly chose in the grill to defer JSON-LD, and ADR-0004 governs the **public** site. Phase 1 is non-public scaffolding, so I marked it `noindex` and made JSON-LD a Phase-2 pre-launch deliverable. Resolves the ADR tension without overriding the locked grill decision.
- **Full taxonomy warning pass (cuisine/new-tag)** — shipped the cheap, hard parts now (course enum + kebab regex); deferred the soft *warning* passes to a later phase (documented), to keep Phase 1 thin.

## Round 2 — Codex

Prior blockers are mostly addressed. JSON-LD deferral is coherent now because Phase 1 is explicitly non-public/noindex, and the `clamp(18px, 1rem + 0.25vw, 20px)` form is fine as written.

Remaining/new issues:

- [PLAN.md](/Users/rob/dev/recipes/PLAN.md:78) updates `docs/recipe-schema.md` and `TEMPLATE.md` for the new image path convention, but [docs/agents/intake.md](/Users/rob/dev/recipes/docs/agents/intake.md:54) still tells agents to reference only the filename. Fix: update `docs/agents/intake.md` in the same step.

- [PLAN.md](/Users/rob/dev/recipes/PLAN.md:60) still says `servings` is just a number, which permits `0` or negative servings and later breaks scaler math. Fix: make it `z.number().positive()`; use `.int()` too if fractional servings are not wanted.

- The “full schema now” claim still inherits a docs conflict: [docs/scaling-and-units.md](/Users/rob/dev/recipes/docs/scaling-and-units.md:139) promises range quantities, but [docs/recipe-schema.md](/Users/rob/dev/recipes/docs/recipe-schema.md:41) and the plan only allow numeric `qty`. Fix: either explicitly defer ranges or choose a range representation before locking the Zod schema.

- [PLAN.md](/Users/rob/dev/recipes/PLAN.md:19) orders the spike before branch/scaffold, but the spike requires an Astro project. Fix: branch + minimal scaffold first, then run the spike before components.

- [PLAN.md](/Users/rob/dev/recipes/PLAN.md:97) uses `CardGrid`, but [PLAN.md](/Users/rob/dev/recipes/PLAN.md:91) does not include it in the component list. Fix: add `CardGrid` explicitly or state the pages inline-map `RecipeCard`.

- `RecipeCard`/recipe pages still sound image-assumptive even though `image` is optional in the schema. Fix: define a no-image fallback or guard rendering so future image-less recipes do not break.

- Astro’s `glob()` loader can load from anywhere on the filesystem, and IDs are URL-friendly from filenames by default, so the revised outside-`src` content plan is plausible; the spike is the right gate. Source checked: Astro content loader/docs on `glob()` and generated IDs. 

VERDICT: APPROVED
### Claude's response (round 2)

APPROVED. Codex confirmed prior blockers resolved (and explicitly agreed the JSON-LD
non-public scoping and the clamp() form are fine). Folded all six round-2 polish nits into
the approved PLAN.md before sign-off:
- intake.md added to the image-path-convention doc updates.
- servings → z.number().int().positive().
- qty ranges explicitly deferred for v1; reconcile scaling-and-units.md §8.
- reordered: branch + minimal scaffold first, THEN the spike.
- CardGrid added to the component list.
- image is optional → RecipeCard + recipe page guard with a no-image fallback.

No findings rejected this round.
