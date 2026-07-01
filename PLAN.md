# Plan: Phase 4 — Reference content (Tips hub, Conversions, About) + nav + no-photo card
_Locked via grill — by Claude + Rob._

## Goal
Build the reference-content layer tabled when Phase 3 was scoped to recipe discovery only
(architecture.md §14 "Reference content"; information-architecture.md §5; epic #15): a **Tips
hub** (`/tips/` + `/tips/<slug>/`), a data-driven **Conversions** page (`/tips/conversions/`),
and a lean **About** page (`/about/`) — plus wire **Tips**/**About** into the header (with a
mobile hamburger) and footer, add a home tips teaser, and replace the bare "Ogilvie" no-photo
card placeholder (#14) with a course line-icon. All static, Counter-styled, progressive
enhancement (works with no JS), indexable under the existing `SITE_LIVE` gate — same conventions
as Phase 3. Lands on `phase-4-reference-content` → PR → CI → merge; deploys the same way.

## Approach

### 1. Branch + tips content collection
1. Branch `phase-4-reference-content` off `main` (done).
2. New **`tips` content collection** in `src/content.config.ts`: glob loader over repo-root
   `tips/` (`['*.md','!TEMPLATE.md']`, top-level only — mirrors the recipes loader). Zod schema
   validates **frontmatter only** (Astro schemas don't cover the Markdown body — Codex R1):
   `title`, `description`, `datePublished`, `dateUpdated?`. The body is the Markdown, rendered via
   `render(entry)`. **No tip tags / no `/tips/<tag>/` pages this phase** — a flat list.
   **Reserved slug:** `conversions` is reserved for the bespoke page (step 8) — `getStaticPaths`
   excludes it and the build fails if a `tips/conversions.md` ever appears (Codex R1).
3. **Seed content (mostly real family content):**
   - **Migrate `reference/useful-information.md` → `tips/`** as the anchor tip (Codex R1 found it
     orphaned — it's recipe-*shaped* but sits in `reference/`, in no collection). Reshape its
     recipe frontmatter (`ingredients`/`instructions`) into tip frontmatter + prose body; **keep
     the roasting temps as transcribed family lore with its existing caveat** — do NOT elevate
     those questionable numbers into the authoritative Conversions tables. Delete the orphaned
     `reference/` file.
   - Plus **1 general how-to** I draft (e.g. blind-baking a crust) so the hub has a technique
     article too. Voiced as general guidance, not family lore; Rob edits/approves. More
     family-voice tips added later.

### 2. Tips hub + tip pages
4. `/tips/` hub (`src/pages/tips/index.astro`): a **featured Conversions card** first, then a
   card per tip (title + description). Breadcrumb `Home › Tips` (+ `breadcrumbJsonLd`). A **generic
   `itemListJsonLd`** over the tips — add a new `(items: {url,name}[])` helper to `jsonld.ts`; the
   existing one is recipe-specific (`/recipes/${id}/`, Codex R1). Indexable.
5. `/tips/[slug].astro` (tip article): Counter article layout (display headings, `--font-body`,
   generous whitespace, breadcrumb `Home › Tips › <title>` + `breadcrumbJsonLd`), rendered
   Markdown body via `render(entry)`, `Article` JSON-LD (`headline`, `description`,
   `datePublished`). **Not** `HowTo` (its strict Rich-Results requirements aren't worth the risk).
   No `data-pagefind-body` (search stays recipe-only — Codex R1).
6. **Recipe→tip deep links** work with no schema change: a recipe's Markdown body can link to
   `/tips/<slug>/` inline. (No new field; just author links when relevant.)

### 3. Conversions (data-driven)
7. `src/data/conversions.ts` — a **curated, cited** module: per-ingredient cup→gram weights
   (flour, sugar, butter, etc.) each with a `source` ("King Arthur" / "USDA"); generic volume
   equivalents (tsp/tbsp/cup ↔ ml, and ↔ g for water); an **oven** °F⇄°C⇄gas-mark table
   (conventional baking pairs — NOT meat-doneness temps, which stay as lore in the migrated tip);
   common tin/pan sizes. Keep the ingredient set **small and verified** — wrong numbers are a
   trust harm. **Export the generic volume constants from `units.ts`** (`ML` is currently private,
   Codex R1) and import them here so the generic math has one source of truth.
8. `/tips/conversions/` (`src/pages/tips/conversions.astro`): renders that data as **accessible
   HTML tables** (`<table>` + `<caption>` + `<th scope>`), each with a visible source note.
   Breadcrumb `Home › Tips › Conversions` (+ `breadcrumbJsonLd`). Indexable; no `data-pagefind-body`.
   Linked prominently from the hub. **Bespoke page, not a tips-collection entry** (its `conversions`
   slug is reserved, step 2), surfaced as the hub's featured card.

### 4. About
9. `/about/` (`src/pages/about.astro`): **lean, contribute-only** — a one-line tagline + a "How
   to contribute" section (email Rob → recipes added via Claude Code intake, `agents/recipe-intake.md`).
   **No story section yet** (added later — we don't invent family history). `AboutPage` JSON-LD +
   `breadcrumbJsonLd`. Breadcrumb `Home › About`. Indexable; no `data-pagefind-body`.

### 5. No-photo card treatment (#14)
10. Replace the `<span class="ph">Ogilvie</span>` in `src/components/RecipeCard.astro` with a
    **course line-icon** centered on a uniform tinted panel. A `src/lib/course-icons.ts` maps
    each of the 13 course slugs → a simple inline SVG (one consistent line weight; `other` is the
    fallback). The icon is **decorative (`aria-hidden`)**; the visible course label + title remain
    the accessible content. **One-accent discipline preserved:** the panel tint is the single
    `--accent-soft`/`--sunken` token (no per-course palette); the *icon* carries course identity.
    Applies wherever `RecipeCard` renders (all-recipes grid, home, taxonomy pages). Search-result
    cards (built in `search.ts`) show no image today and are left unchanged.

### 6. Nav + home wiring
11. **Header** (`src/components/Header.astro`): add **Tips** and **About** to the primary links
    (desktop inline: wordmark · Recipes · Categories▾ · Tips · About · search · theme — the IA's
    ≤5 primary items). Build the **mobile hamburger** on a **native `<details>`** ("Menu"
    `<summary>` = ☰) so it works with **no JS** and is button-driven (never hover): on small
    screens it reveals a full-width sheet listing the primary links, with the course links
    **flattened inline** (so we avoid a nested `<details>` inside the sheet). Search stays
    reachable outside the sheet. The `<summary>` has an **accessible "Menu" name** (visible label
    or `aria-label`, Codex R1). **JS-enhance** (mirroring the Phase 3 dismissible-widget patterns):
    Esc closes + returns focus to the toggle, close-on-navigate, outside-click/focus-out close.
    Rely on the **native `<details>` open state**; only mirror `aria-expanded` via the `toggle`
    event if needed — no hand-managed stale ARIA.
12. **Footer** — implement the fuller IA §4 footer (Codex R1): quick links (Recipes · Categories ·
    Tips · About · RSS) + an "Add a recipe — email Rob" contribution line, alongside the existing
    © + universe line. **Home** gains a short **Tips teaser** section (one line + link to `/tips/`),
    kept small so the page still breathes.

### 7. SEO / gate / tests
13. All new pages indexable under `SITE_LIVE` (noindex when staged via the `Base` default; in the
    sitemap; canonical URLs). JSON-LD: `Article` + `BreadcrumbList` (tips), `AboutPage` +
    `BreadcrumbList` (about), generic `ItemList` + `BreadcrumbList` (hub), `BreadcrumbList`
    (conversions). New generic `itemListJsonLd({url,name}[])` helper in `jsonld.ts` (the existing
    one is recipe-only). The new pages carry **no `data-pagefind-body`**, so search stays
    recipe-only.
14. Tests: extend `scripts/smoke.mjs` (tips hub renders + lists tips + features Conversions; a tip
    page renders its body; `/tips/conversions/` has data tables; `/about/` has the contribute
    section; header includes Tips + About; `RecipeCard` no longer emits "Ogilvie" and emits a
    course-icon `<svg aria-hidden>`; sitemap includes `/tips/`, a tip, `/tips/conversions/`,
    `/about/`; **each new page's `BreadcrumbList` parses + every non-last item has an `item` URL**;
    **no new page carries `data-pagefind-body`**, and the built **Pagefind index/search surfaces
    only `/recipes/…/` URLs** — no tip/about/conversions page leaked into search). Extend `scripts/smoke-browser.mjs` (mobile
    hamburger opens/closes via the toggle, Esc closes + refocuses, no console errors). Add Vitest
    tests: `conversions.ts` integrity (every per-ingredient row has a positive gram weight + a
    source; known values like flour≈120 g/cup) and every course slug maps to an icon.

## Key decisions & tradeoffs
- **All three + #14 + nav in one phase** (per epic #15), consistent with the Phase 3 conventions.
- **Tips hub seeded with general how-tos + Conversions anchor** so it launches non-empty; family
  tips come later. General tips are voiced as general guidance, not family lore.
- **Conversions from a curated, cited data module** — not corpus-derived (noisy) and not
  generic-only (less useful). Small, verified ingredient set; sources shown.
- **About is contribute-only now** — no invented family narrative.
- **No-photo card = course icon on a uniform tint** — respects Counter's strict one-accent rule
  (icon carries course identity, not color).
- **Mobile hamburger built now** (IA §4) on a native `<details>` base so the no-JS path works and
  the focus surface is smaller than a bespoke focus-trapped sheet; JS only enhances.
- **The orphaned `reference/useful-information.md` becomes the anchor Tips article** instead of
  drafting a generic one — real family reference content, migrated (recipe-shape → tip-shape),
  with its questionable roasting temps kept as *transcribed lore* (not authoritative Conversions).
- **Search stays recipe-only**, guaranteed two ways: (1) Pagefind indexes **only** pages carrying
  `data-pagefind-body` once that attribute exists anywhere on the site — verified in the Phase 3
  build ("Found a data-pagefind-body element on the site. Ignoring pages without this tag" →
  indexed exactly 77 recipe pages), so the new tips/about/conversions pages (which don't carry it)
  are excluded by construction; (2) `search.ts`'s `safeRecipeUrl` allowlist means even a future
  indexing change could never render a non-`/recipes/…/` result. A smoke assertion verifies no
  non-recipe page is Pagefind-indexed (see step 14). (Codex R2 argued `data-pagefind-body` absence
  doesn't exclude — that contradicts Pagefind's documented behavior and our own build log, so the
  mechanism claim is rejected; its verification suggestion is adopted.) Broadening to site-wide
  search is a deliberate later decision.

## Risks / open questions
- **Mobile hamburger a11y** is the bug-prone piece (Phase 3's a11y bugs clustered on dismissible
  widgets): focus return on Esc, close-on-navigate, `aria-expanded`, no-JS behavior, and avoiding
  a nested `<details>` (mitigated by flattening categories inline in the sheet). Mirror the
  Categories/print-menu patterns exactly.
- **Conversions accuracy** — wrong numbers erode trust; keep the set small, cite every row, and
  unit-test known values.
- **Tip provenance** — general how-tos must not read as family lore; mark them as general guidance.
- **Course icons** — 13 SVGs must share one line weight/size to fit Counter; `other` needs a
  sensible fallback; icons must scale cleanly at card thumbnail size.
- **Home restructure** is minor but touches the just-shipped Phase 3 home — keep the teaser small.
- **Reserved-slug guard** (`conversions`) must be enforced in both the collection filter and
  `getStaticPaths` (and fail the build if violated), or `/tips/conversions/` silently double-routes.
- **Migrating the reference file** must not leave a dangling recipe entry or break its transcription
  fidelity; confirm nothing references `reference/useful-information.md` before deleting it.

## Out of scope
- Family **story** on About; **family-voice** tips (both later).
- Tip **tags** / `/tips/<tag>/` pages (flat list this phase).
- `HowTo` rich-result JSON-LD (use `Article` to avoid strict-requirement risk).
- **Per-course color palette** (keep Counter's single accent).
- Heritage layer (scanned cards, provenance, Family Notes, audio), a global all-tags index/tag
  cloud, and any server-side search or search-query analytics (epic #15 "not Phase 4").
- Redesigning the recipe page or the Phase 3 browse/search surfaces beyond the no-photo card +
  the nav additions.
