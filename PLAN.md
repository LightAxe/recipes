# Plan: Phase 3 — Browse & Find (search + taxonomy browse)
_Locked via grill — by Claude + Rob._

## Goal
Make 77 live recipes discoverable. Phase 2 shipped the recipe page + interactivity but left
only a single flat `/recipes/` index — no search, no category/tag/cuisine/contributor browse.
Phase 3 builds the **recipe-discovery layer** described in `docs/information-architecture.md`:
build-time-generated taxonomy browse pages for all four axes, site-wide client search
(Pagefind), an in-page faceted filter on `/recipes/`, and a home page rebuilt around browse —
all as **progressive enhancement** over static, indexable pages (no-JS browses fully). Tips
hub, Conversions, and About are explicitly **out** (a later reference-content phase). Lands on
`phase-3-browse-find` → PR → CI → merge; ships staged behind the existing `SITE_LIVE` gate and
goes live the same way Phase 2 did.

## Approach

### 1. Branch + dependencies
1. Branch `phase-3-browse-find` off `main`.
2. Add **pagefind** and **gray-matter** as dev dependencies (gray-matter only for the
   config-time frontmatter scan, step 7). No runtime framework — the search UI is a small
   vanilla TS island consistent with `src/scripts/recipe.ts` (no React/Vue).

### 2. One taxonomy module (the single source of truth)
3. `src/lib/taxonomy.ts` — a **pure** module that exports: the **course slugs + labels**
   (one ordered list), a `slugify(s)` (lowercase → trim → `&`→` and ` **first** → strip
   diacritics → non-alnum→`-` → collapse → trim, per `taxonomy.md` §6), and a `termIndex`
   helper that, given the recipe set, returns each axis's term→recipes map + the **singleton
   set** (terms with exactly one recipe). `content.config.ts` **imports the course slugs from
   here** for its Zod enum (kills the duplicate `COURSES` array — Codex R1). **`termIndex`
   fails the build (throws) on a within-axis slug collision** (two distinct labels slugging to
   the same value — Codex R2), so a silent merge can't happen. Vitest covers slugify (incl.
   `Cajun & Creole → cajun-and-creole`) and a colliding-label case.

### 3. Taxonomy browse pages (all four axes, generated from frontmatter)
4. New routes via `getStaticPaths` over the `recipes` collection (no hand-maintained files).
   Term sets are derived live from frontmatter at build (counts below are indicative, not
   hardcoded — the scan is the source of truth):
   - `/category/<course>/` — course (enum).
   - `/tag/<tag>/` — tags (the largest set; long singleton tail).
   - `/cuisine/<cuisine>/` — cuisine ("American" ≈ most of the collection).
   - `/from/<contributor>/` — contributor (a handful of attributed recipes).
5. **One shared list-page layout/component**: H1 = the term's label, optional one-liner, a
   `CardGrid` of matching recipes, `ItemList` JSON-LD (reuse `src/lib/jsonld.ts`), breadcrumb
   (`Home › <axis label> › <term>` where **the axis segment is non-linking** — there are no
   axis index pages in scope, so it is plain text and is **not** emitted as a linked
   `BreadcrumbList` item; only Home and the term carry URLs — Codex R1).
6. **Only non-empty terms generate pages** (`taxonomy.md` §1) — `getStaticPaths` derives the
   term set from actual frontmatter, so empties never exist.
7. **Thin-page policy (decided — my technical call):** every non-empty page is generated and
   fully reachable (no dead chip ever), but a page with **exactly one** recipe gets a
   page-level `noindex` and is **excluded from the sitemap**; it auto-promotes to indexed when
   a 2nd recipe shares the term. **Uniform across ALL four axes incl. course** — current
   content has singleton courses `drink` and `sauce`, so course is *not* exempt (Codex R1
   corrected my false assumption). The singleton set comes from `termIndex` (step 3).

### 4. Page-level noindex + sitemap exclusion
8. `Base.astro` currently emits `noindex` only from the global `SITE_LIVE` gate. Add a
   **`noindex` page prop**; the meta is emitted when **`!SITE_LIVE || noindex`** (Codex R1).
   Singleton list pages pass `noindex`.
9. `@astrojs/sitemap` is bare and can't see per-term counts. Add a build-time helper that
   scans the recipe files with the **same include/exclude as the content loader**
   (`['*.md','!TEMPLATE.md']`) using gray-matter + `fs` (**not** `astro:content`, unavailable
   in `astro.config`), producing **minimal recipe records** (course/tags/cuisine/contributor)
   that it passes through the **same `termIndex`** from `src/lib/taxonomy.ts` — not just
   `slugify` — so the singleton set is computed by identical logic to the pages (true single
   source, Codex R3). From its singleton terms it builds the set of **singleton taxonomy URLs**. `@astrojs/sitemap` passes **full absolute URLs** to `filter`,
   so build the exclusion set as **canonical absolute URLs with trailing slash**
   (`new URL(`/category/${slug}/`, site).href`, etc.) and `filter: (url) => !singletons.has(url)`
   (Codex R2). Because both the `noindex` decision and the sitemap filter derive from the
   **same** slugify + scan, they can't drift (Codex R1). Existing `SITE_LIVE` robots behavior
   unchanged.

### 5. Site-wide search (Pagefind, lazy-loaded)
10. **Index at build:** run `pagefind --site dist` from the npm **`postbuild`** script **only**
    (npm runs `postbuild` automatically after `build`). CI and deploy keep calling `npm run
    build` and inherit it — no duplicate/divergent pagefind invocation anywhere (Codex R2). Mark
    **only recipe pages** as indexable (`data-pagefind-body` on the recipe article); list/home/
    search pages are excluded from results. Emit **explicit `data-pagefind-meta`** for every
    field a result card displays — title, course **label**, image src + alt (if any), and
    time/yield — because `data-pagefind-filter` is for filtering, not display (Codex R1). Add
    `data-pagefind-filter` (course) for optional result filtering.
11. **Deploy caching (Codex R1):** the two-pass S3 sync long-caches immutable assets; Pagefind's
    `/pagefind/` bundle uses **stable** filenames, so it must **not** get the 1-year immutable
    header. Exclude `pagefind/**` from the immutable pass and upload it with **short revalidation
    caching** (like HTML) so a re-indexed search can't be served stale from cache.
12. **Header search field on every page** (decided): a real `<form>` (GET → `/search/?q=`) so it
    works with no JS and is keyboard-reachable. JS enhances it into an **instant** dropdown.
    **Pagefind lazy-loads** — the WASM + index fetch on **first focus/keystroke**, never on page
    load — so idle recipe/category/home pages keep the Phase-2 performance budget.
13. **`/search/` page:** the no-JS submit target and a deep-linkable results URL. **Exception to
    lazy-load (Codex R1):** when `/search/` loads with a `?q=` present, it **auto-runs** the
    query on page load (deep links must show results without a focus event). Without JS it shows
    the query and guides the user to Categories/browse; in dev (no index) it fails gracefully.
14. **XSS-safe result rendering (Codex R1):** Pagefind result data is untrusted client input
    derived from frontmatter. Define a **serializable search-card shape** and a **small vanilla
    client renderer** that visually matches `RecipeCard` — the Astro `RecipeCard`/`CardGrid`
    components can't be reused client-side (they need `CollectionEntry<'recipes'>`). Titles and
    all metadata are written via **`textContent`** (never innerHTML); only Pagefind's own
    `excerpt` (which escapes text and injects just `<mark>`) may use innerHTML; result URLs are
    **validated to match `^/recipes/`** before becoming an `href`.

### 6. Faceted `/recipes/` (progressive enhancement)
15. Server-render the **complete** static grid of all recipes in a **deterministic A–Z order**
    (the no-JS experience — sorted, browsable) plus a row of facet **links** into the taxonomy
    pages. The **sort control is hidden until JS initializes** (Phase-2 pattern) so no-JS never
    sees a sort widget it can't honor (Codex R1).
16. JS enhances into an **in-place facet filter**: **course/tag/cuisine/contributor** checkboxes
    (contributor included for IA consistency — Codex R1) + a Newest/A–Z sort, no page reload,
    filtering the already-rendered cards (each card carries `data-course/-tags/-cuisine/
    -contributor/-title/-date`). **All facet `data-*` and query values are taxonomy slugs, not
    display labels** (labels are for display only) — so `Cajun & Creole` can't desync from
    `cajun-and-creole` between the chip, the card, and the URL (Codex R3). Semantics: **OR within
    an axis, AND across axes.** State is
    mirrored to the **URL query** as **repeated params** (`?course=dessert&tag=apple&tag=pecan&
    sort=newest`), read via `URLSearchParams.getAll()`; values are **sorted** before writing the
    URL so the same selection always yields the **same canonical, shareable** URL. Back works
    (popstate re-applies); on load the page hydrates from the query. Empty result → a clear
    "no recipes match" with a reset.

### 7. Home page rebuilt around browse (decided)
17. Hero: wordmark + tagline + the search field. **Browse by category:** enamel tiles, one per
    **non-empty** course (label + count), linking to `/category/<course>/`. **Latest additions:**
    a strip of the most recent recipe cards by `datePublished` — with a **stable fallback**
    (recipes lacking `datePublished` sort last, tiebroken by title) so the build is deterministic.

### 8. Header / nav
18. Extend `Header.astro`: add a **Categories** control built as a **native `<details>/<summary>`**
    listing the non-empty course links → `/category/` pages — so it **fully works with no JS**
    (Codex R2); JS enhances it (full-screen sheet on mobile, **no hover-only**, Esc/outside-click
    close, focus management). Add the **search field**. Keep wordmark · Recipes · Categories ·
    search · ThemeToggle. **Tips/About are intentionally absent** (deferred — no dead links). Add
    breadcrumbs to recipe + taxonomy pages (axis segment non-linking, per step 5). Recipe-page
    foot: "More <course>" and (if attributed) "More from <contributor>" links to tie browse together.

### 9. SEO / structured data / tests
19. `WebSite` JSON-LD + `SearchAction` (`/search/?q={query}`) on home; `ItemList` on every list
    page; `BreadcrumbList` (Home + term only; axis segment non-linking) where breadcrumbs render.
    Sitemap includes all indexable taxonomy pages (minus singletons, per steps 7 & 9).
20. Tests: extend `scripts/smoke.mjs` (a `/category/<course>/` page renders + lists cards; a known
    singleton page — e.g. `/category/drink/` — carries `noindex` and is **absent** from
    `dist/sitemap-0.xml`; `dist/pagefind/` exists; `/search/` exists) and `scripts/smoke-browser.mjs`
    (facet filter changes the visible card count; Categories dropdown opens; search box loads
    Pagefind on focus and returns a hit for a known title). Unit-test `src/lib/taxonomy.ts`
    slugify (incl. `cajun-and-creole`) with Vitest. CI must run `pagefind` before the smoke step
    or the index assertions fail.

## Key decisions & tradeoffs
- **Scope = recipe discovery only.** Tips/Conversions/About deferred to a later phase (architecture
  §14 phase 5). Risk: header has no Tips/About yet — accepted (no dead links > premature nav).
- **All four taxonomy axes**, despite weak data on two (cuisine is dominated by one big "American"
  bucket + singletons; only a handful of recipes are attributed to a contributor). Justified by
  near-zero cost (`getStaticPaths`) and the family-site value of `/from/`. The singleton-noindex
  policy contains the SEO/thin-content downside.
- **Site-wide instant search over a dedicated-page-only design** (Rob's call): better UX, paid for
  by **lazy-loading** Pagefind so the cost lands only when a user actually searches.
- **In-page JS facet filter on `/recipes/`** (Rob's call) even though it overlaps search + taxonomy
  pages — richer single-page browse; kept safe by full no-JS fallback + URL-state.
- **Single source of truth for course slugs/labels + term counts/slugify** (`src/lib/taxonomy.ts`):
  `content.config.ts` imports the **course slugs for its Zod enum** (no more duplicate `COURSES`
  array), and the page-level `noindex` + sitemap-exclusion both derive from the **same** slugify +
  frontmatter scan — so they cannot drift apart (Codex R1).

## Risks / open questions
- **Pagefind ↔ static build ordering.** Index is generated from `dist/` *after* `astro build`, so
  every consumer (npm `build`, CI smoke, S3 deploy) must run pagefind and ship `dist/pagefind/`.
  A staged (`SITE_LIVE=false`) build still needs the index for search to work pre-launch. Dev
  (`astro dev`) has no index — search box must degrade gracefully (form still submits to `/search/`).
- **Config-time frontmatter scan.** Computing singleton URLs in `astro.config` means parsing
  `recipes/*.md` with gray-matter (not `astro:content`). Must use the **same** slugification as the
  pages or the sitemap filter silently misses/over-excludes. Mitigated by sharing `src/lib/taxonomy.ts`.
- **Tag explosion in nav/UI.** The tag set is large (long singleton tail) — `/tag/` pages are
  fine, but we must **not** dump every tag into any menu. Tags surface only as chips on recipes/
  cards and via search; no global tag index in this phase (could be a later "tag cloud" if wanted).
- **Slug collisions** — cross-axis is safe (separate path namespaces, `/category` vs `/cuisine`);
  within-axis collisions are now a **hard build failure** in `termIndex` (step 3), not just a risk.
- **Filter + Back-button/URL state** correctness (popstate, initial query hydration) is the most
  bug-prone client piece — covered by a browser smoke assertion.

## Out of scope
- Tips hub, tip pages, Conversions tables, About page (later reference-content phase).
- Heritage layer (scanned cards, provenance, audio).
- Server-side search, any backend, analytics on search queries.
- A global all-tags index / tag cloud.
- Redesigning the recipe page itself (Phase 2 owns it) beyond adding foot "More …" links + breadcrumb.
- **Richer search-result cards + the Pagefind _filter_ plane.** Result cards show title · course ·
  excerpt only; `data-pagefind-filter` and image/time/yield result `meta` are intentionally **not**
  emitted this phase — they'd be dead index weight with no renderer consuming them. Add them together
  with the UI that displays/filters on them (revised down from the original plan's step 10 wording).
