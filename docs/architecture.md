# Architecture Review

*Drafted 2026-06-29. A real review of how we plan to build the family recipe site, before
wiring anything together. Grounded in the decisions in `docs/adr/` and the conventions of
the sibling sites in the axpr cinematic universe (axpr.net, subterrans, goatmeal,
zombietrailers, fasterpack, pollicio.us). This is a living document — we iterate on it.*

## 1. Goals this architecture must satisfy

From `AGENTS.md` and the research:

- **Durable for decades** — recipes survive any framework's death (plain text in git).
- **Recipe-first, accessible to boomers → Gen Alpha** — semantic, legible, high-contrast.
- **Full-interactive v1** — cook mode, serving scaler, unit toggle, tap-to-check, timers.
- **Mobile + desktop + a real print view** (incl. a 4×6 card).
- **Public + SEO** — schema.org/Recipe JSON-LD, sitemap.
- **Photos** — optimized at build, EXIF-stripped, committed in-repo.
- **Grown via Claude Code intake** — the `recipe-intake` agent writes Markdown files
  against a typed schema and **researches ingredient weights in grams** (ADR-0008).
- **Cook by weight** — researched grams power a Weight display/print option + a remembered
  "prefer weight" preference.
- **Part of the universe** — signature footer, hub registry entry, family stack & infra.
- **Near-zero ongoing maintenance and cost.**

## 2. The one big architectural principle: progressive enhancement

**The recipe is complete, semantic, server-rendered HTML. JavaScript only enhances it.**

This single principle resolves most tensions at once:

- A recipe is fully readable, printable, and indexable **with zero JS**. Accessibility,
  SEO, durability, and the print view all fall out of "it's just good HTML."
- The interactive features (cook mode, scaler, unit toggle, tap-to-check, timers) are
  layered on top as small scripts that read/write the DOM. If JS fails or is disabled,
  the reader still gets the whole recipe at base quantities.
- It keeps the page **light** — critical for a phone propped on a kitchen counter.

Everything below serves this principle.

## 3. Tech stack (aligned with the Astro siblings)

| Concern | Choice | Why / sibling precedent |
|---|---|---|
| Generator | **Astro 6** (static output) | axpr.net & subterrans run Astro 6; islands give interactivity with minimal JS. ADR-0003. |
| Language | **TypeScript**, Node **≥22.12** | Matches siblings; typed content schema. |
| Styling | **Tailwind CSS 4** via `@tailwindcss/vite`, design tokens in a `@theme` block | Matches axpr.net & subterrans; tokens keep the aesthetic consistent. |
| Content | **Astro Content Collections** + **Zod** schema | Validates every recipe at build (catches intake mistakes). Mirrors `content.config.ts` in siblings. |
| Fonts | **`@fontsource-variable`** (self-hosted) | Siblings self-host fonts; no third-party request, better privacy/perf. Specific faces chosen in `docs/design.md`. |
| Interactivity | **Vanilla TS modules** in Astro `<script>` (consider Preact islands only if state grows) | Recipe interactions are DOM-state toggles + light math; a framework would be overkill and heavier. |
| Images | **`astro:assets`** (sharp) + **ExifTool** pre-commit | Build-time AVIF/WebP/responsive; EXIF strip for privacy. ADR-0004. |
| Analytics | **Cloudflare Web Analytics** (token at build) | Universe convention; cookieless. |
| Deploy | **AWS S3 + CloudFront**, GitHub Actions OIDC, Route 53 | Universe convention. ADR-0006 (proposed). |

We deliberately do **not** add: a database, a server runtime, a CMS, a UI component
library, or a heavy SPA framework. None are needed for a static archive.

## 4. Content architecture

Recipes are the source of truth, decoupled from the site that renders them.

```
recipes/                         # source-of-truth content (already started)
├── TEMPLATE.md
├── grandmas-apple-pie.md        # one Markdown file per recipe (frontmatter + body)
└── images/<slug>/               # colocated photos, optimized at build, EXIF-stripped
```

- The Astro Content Collection points at `recipes/` and validates frontmatter against a
  **Zod schema that is the executable mirror of `docs/recipe-schema.md`**. The doc and the
  Zod schema must stay in sync; the Zod schema is the enforcement.
- **Ingredients are structured** (`qty`/`unit`/`item`/`grams`) precisely so the scaler and
  unit toggle can operate on them — see §5.
- Tips/reference content and (later) heritage material are **separate collections**
  (`tips/`, later `stories/`), so the recipe schema stays clean.

### Derived outputs from one recipe file

The "single source, many views" idea (research/03) becomes concrete build outputs:

```
                         ┌─→ Recipe page (semantic HTML)
                         ├─→ schema.org/Recipe JSON-LD  (in <head>)
recipe .md (frontmatter) ┼─→ Print + 4×6 card view      (@media print / print route)
   + body                ├─→ Card on index/category/search pages
                         └─→ Entry in sitemap.xml (+ optional RSS of new recipes)
```

## 5. Interactivity architecture (the meat of "full-interactive v1")

Each feature, designed as enhancement over static HTML:

- **Serving scaler (1×/2×/3× + editable):** server-render base quantities with data
  attributes (`data-qty`, `data-grams`, `data-unit`). A small script multiplies and
  re-renders display values (rendering nice fractions, e.g. `0.75 → ¾`). State lives in
  the URL/`localStorage` so a refresh keeps the scale. No-JS: base quantities show.
- **Unit toggle (imperial/metric, volume/weight):** the same script converts common
  volume/weight units; the **weight view uses `grams`** when present (per-ingredient,
  the King Arthur approach). No-JS: as-authored units show.
- **Tap-to-check ingredients & steps:** each is a list item with a checkbox/`aria-pressed`
  toggle; CSS strikes it through. Pure DOM, optional `localStorage` persistence per recipe.
- **Cook mode:** a toggle that (a) adds a `cook-mode` class driving a CSS layout with
  large step text and dimmed chrome, and (b) requests the **Screen Wake Lock API**
  (re-acquire on `visibilitychange`, release on exit, with a battery note). No-JS: normal
  page, no wake lock — still fully usable.
- **Tappable timers:** steps with a `timer` (ISO-8601) render a button that starts an
  in-page countdown (with an optional sound/notification). No-JS: the duration is just text.
- **Theme toggle (light/dark, both at v1):** a pre-paint inline `<head>` script sets
  `data-theme` from `localStorage` → `prefers-color-scheme` (no flash); a nav toggle
  flips it and persists the choice. No-JS: the page renders in the system-preferred theme
  via CSS `prefers-color-scheme` defaults.

**Why vanilla TS, not React:** these are independent, mostly-stateless DOM behaviors with
no shared client state tree. A few small typed modules (`scaler.ts`, `units.ts`,
`cookmode.ts`, `timers.ts`, `checklist.ts`) hydrated per-recipe keep the JS payload tiny
and the markup accessible. We'll revisit Preact islands only if a feature needs real
reactive state. This is a reversible call.

## 6. Styling & design-system architecture

- **Design tokens** (color, type scale, spacing, radii, shadows) defined once in a
  Tailwind v4 `@theme` block + CSS custom properties — the single place the aesthetic
  lives, exactly like subterrans' `@theme`.
- **The aesthetic is "Enamelware"**, designed via the Databricks `frontend-design` skill
  (installed in `.claude/skills/`) and documented in **`docs/design.md`**: a distinct,
  bold mid-century-kitchen direction meeting the cross-generational accessibility baseline
  (≈18–20px base, ≥4.5:1 contrast, ~48px targets, no hover-only).
- **Both themes ship at v1:** "Counter" (light, default) and "Night Kitchen" (dark), via a
  `data-theme` attribute over the same token set + a pre-paint script (no flash).
- **Three style surfaces, one token set:** screen, cook mode, and print all draw from the
  same tokens so they stay coherent.
- A short list of reusable components: `RecipeCard`, `IngredientList`, `StepList`,
  `RecipeMeta` (times/yield/contributor byline), `Scaler`, `UnitToggle`, `CookModeBar`,
  `Timer`, `Nav`, `Footer` (with the universe line), `Hero`/`Figure`.

## 7. SEO & structured data

- **schema.org/Recipe JSON-LD** generated from frontmatter into each recipe's `<head>`
  (ADR-0004); validated against Google's Rich Results Test before launch.
- **`ItemList`** on category/index pages to qualify for host carousels.
- `sitemap.xml` (Astro integration), sensible titles/OG tags/canonical URLs, and an
  optional RSS feed of newly added recipes (siblings ship RSS).

## 8. Images & privacy pipeline

- Authors drop a photo in `recipes/images/<slug>/`; `astro:assets` emits AVIF+WebP+sized
  `srcset` with `sizes`, lazy-loading below the fold and eager-loading the hero (LCP).
- **EXIF/GPS stripped before commit** (`exiftool -all=`) — the site is public; geotags
  can leak a home address (ADR-0004). This is part of the intake checklist
  (`docs/agents/intake.md`).
- Photos are committed in-repo (no Git LFS, no image CDN) — fine at our scale and keeps
  the build self-contained.

## 9. Cinematic-universe integration

- **Footer** on every page: "Part of the [axpr](https://axpr.net) cinematic universe"
  (styled to *our* aesthetic, like every sibling does). ADR-0007.
- **Hub registry:** add this site to `personal-site/src/data/site.ts` with a category tag
  (proposed `family`). That edit happens in the `personal-site` repo, so it's Rob's to make.
- **Analytics & infra** match the family (Cloudflare Analytics; S3/CloudFront/Route53).

## 10. Deploy & infra (proposed, ADR-0006)

- **Build:** `astro build` in GitHub Actions on push to `main`.
- **Deploy:** two-pass S3 sync (long-cache immutable assets, short-cache HTML) +
  CloudFront invalidation, via OIDC role (no static AWS keys) — reuse
  `personal-site`/`goatmeal_org` `deploy.yml` as the template.
- **DNS:** Route 53 record → CloudFront. **Domain: open question** (see §13).

## 11. Eventual repo structure

```
.
├── AGENTS.md / CLAUDE.md / CONTEXT.md
├── docs/                       # architecture.md, design.md, recipe-schema.md, adr/, agents/
├── recipes/                    # content (source of truth) + images/
├── research/
├── src/
│   ├── pages/                  # index, recipe/[slug], category/[tag], tips, search, 404
│   ├── layouts/                # Base layout (head, nav, footer, analytics)
│   ├── components/             # RecipeCard, IngredientList, Scaler, CookModeBar, ...
│   ├── scripts/                # scaler.ts, units.ts, cookmode.ts, timers.ts, checklist.ts, theme.ts
│   ├── lib/                    # jsonld.ts, scaling.ts, units.ts (pure, unit-tested)
│   ├── styles/                 # tokens + global + print stylesheet
│   └── content.config.ts       # Zod schema (mirrors docs/recipe-schema.md)
├── astro.config.mjs
├── tailwind config (v4 via @tailwindcss/vite)
└── .github/workflows/deploy.yml
```

## 12. Quality: accessibility, performance, testing

- **Accessibility budget:** WCAG AA (AAA for contrast/target-size where cheap), verified in
  **both themes**; keyboard operability for every interactive control;
  `prefers-reduced-motion` respected; the no-JS path is a first-class experience, not a
  fallback afterthought.
- **Performance budget:** fast first paint, hero as LCP, tiny per-recipe JS; target a
  near-100 Lighthouse across the board (the static + progressive-enhancement design makes
  this attainable).
- **Testing:** unit-test the pure logic (`scaling`, `units`, `jsonld` generation) — these
  are where correctness bugs hide (e.g. fraction rendering, gram conversions). Schema
  validation is enforced at build by Zod. A Rich-Results check before launch.

## 13. Risks & open questions

1. **Domain / URL.** Needs a home to join the universe and get a CloudFront cert.
   Subdomain (`recipes.axpr.net`) vs. a dedicated domain? *Decision needed.*
2. **Hosting parity (ADR-0006).** Confirm S3+CloudFront over Cloudflare Pages. *Decision needed.*
3. **Design direction.** The aesthetic is the next big collaborative step (frontend-design
   skill). Must be distinct from siblings yet maximally legible across generations. *Decision needed.*
4. **Unit conversion scope.** Full volume↔weight needs `grams` per ingredient; without it
   we can still do scaling + imperial/metric volume. How hard do we push weight at v1?
5. **Scaling correctness.** Linear scaling misleads for salt/leavening/eggs; we should show
   a gentle caveat and keep egg-like discrete items sensible.
6. **Search.** Client-side (Pagefind/Fuse over a static index) keeps it serverless; scope
   for v1 vs. browse-only to start?
7. **Category taxonomy.** Course/cuisine/tags need a small controlled vocabulary to keep
   browse coherent as the collection grows.

*Resolved since first draft:* hosting (S3+CloudFront, ADR-0006); design direction
("Enamelware", `design.md`); themes (both light+dark at v1); illustration scope (minimal).

## 14. Proposed build phases (after architecture & design are locked)

1. **Scaffold:** Astro 6 + Tailwind 4 + TS, content collection + Zod schema, base layout,
   universe footer, analytics, deploy pipeline — render the apple-pie example statically.
2. **Recipe page core:** semantic recipe template, RecipeCard, JSON-LD, print + 4×6 card.
3. **Interactivity:** scaler, unit toggle, tap-to-check, cook mode + wake lock, timers.
4. **Browse & find:** index, category pages, (optional) search.
5. **Reference content:** tips/technique hub, conversions, glossary.
6. **Polish & launch:** a11y/perf pass, Rich-Results validation, domain + registry entry.
7. **Later phases:** heritage layer (scanned cards, provenance, Family Notes, audio).

## 15. Decision map

| Area | ADR / Doc | Status |
|---|---|---|
| Data format | ADR-0002, `recipe-schema.md` | accepted |
| Astro static site | ADR-0003 | accepted |
| Public + JSON-LD | ADR-0004 | accepted |
| Claude Code intake | ADR-0005, `agents/intake.md` | accepted |
| S3 + CloudFront infra | ADR-0006 | **proposed — confirm** |
| Universe integration | ADR-0007 | accepted |
| Visual design direction | `design.md` | **next — collaborative** |
