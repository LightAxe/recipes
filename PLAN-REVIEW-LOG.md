# Plan Review Log: Phase 3 — Browse & Find (search + taxonomy browse)
Act 1 (grill) complete — plan locked with the user. MAX_ROUNDS=5.

Grill outcomes (Rob's calls): scope = recipe-discovery only (Tips/Conversions/About deferred);
all four taxonomy axes (category/tag/cuisine/from); site-wide instant search; in-page JS facet
filter on /recipes/; full home rebuild (tiles + latest + search); header Categories dropdown.
Technical calls taken by Claude: singleton-page noindex+sitemap-exclude policy; Pagefind
lazy-load; URL-state facet filtering; shared taxonomy slug/count source of truth.

## Round 1 — Codex
**Findings**
- High: `dist/pagefind/` would be uploaded with one-year immutable caching by the first S3 sync, but Pagefind's `/pagefind/` bundle/index uses stable names → browser-cached stale search. Fix: exclude `pagefind/**` from the immutable sync, upload with short revalidation caching.
- High: the singleton policy assumed all course pages are ≥2, but current content has singleton courses `drink` and `sauce`. Fix: compute singleton noindex/sitemap exclusion across all four axes, including course.
- High: `Base.astro` has only the global `SITE_LIVE` noindex gate, so singleton pages have no way to emit `noindex` on a live build. Fix: add a page-level `noindex`/`robots` prop, emit when `!SITE_LIVE || pageNoindex`.
- High: the config-time scan says `recipes/*.md` with `gray-matter`, but `gray-matter` isn't a dependency and `TEMPLATE.md` would be included unless excluded. Fix: mirror the content loader's include/exclude (`!TEMPLATE.md`) and add a parser dep (or reuse `yaml`).
- High: Pagefind result metadata is raw client data; rendering title/image/course via template strings = XSS from recipe frontmatter/search metadata. Fix: render with DOM APIs/`textContent`, validate result URLs start with `/recipes/`, never inject raw metadata as HTML.
- Medium: `data-pagefind-filter(course)` alone can't render cards; filters filter, display needs metadata. Fix: add explicit `data-pagefind-meta` for title, course label, image/alt, time/yield.
- Medium: "reuse `RecipeCard`/`CardGrid`" isn't implementable client-side — those Astro components expect `CollectionEntry<'recipes'>`. Fix: define a serializable search-card shape + a small client renderer that visually matches `RecipeCard`.
- Medium: `/recipes/` filtering omits the contributor axis though the IA specifies course/cuisine/tag/contributor. Fix: include contributor data/filter or explicitly revise scope/docs.
- Medium: no-JS A–Z/Newest sort is impossible on a single static `/recipes/` page if sort is client-only. Fix: hide sort until JS enhances (static deterministic order), or generate real sorted routes.
- Medium: taxonomy breadcrumbs `Home › <axis> › <term>` imply axis index pages, which are out of scope. Fix: make the axis crumb non-linking / omit from JSON-LD.
- Medium: search lazy-loading says "never on page load," but `/search/?q=` must load on page load for deep-linked results. Fix: lazy on focus globally, auto-load on `/search/` when `q` present; catch missing-index in dev.
- Medium: "single source of truth" is false while course slugs are in `content.config.ts` and labels in `taxonomy.ts`. Fix: export courses/labels/slugify from one module, import into both schema and UI, with a test.
- Low: slugification order is ambiguous; if `&`→`and` happens after stripping punctuation, `Cajun & Creole` → `cajun-creole`. Fix: replace `&` with ` and ` before stripping, unit-test that case.

VERDICT: REVISE

### Claude's response
All 13 accepted — every one is legitimate. Two are real catches against my own assumptions (singleton **course** pages exist; client-result XSS). Revisions to PLAN.md:
- **Singleton policy now spans all four axes incl. course** (removed the false "course always ≥2"); `drink`/`sauce` will be noindex+desitemapped until a 2nd recipe joins.
- **Base.astro gains a `noindex` prop**; emits when `!SITE_LIVE || pageNoindex`. List pages pass `noindex` for singletons.
- **One taxonomy module** (`src/lib/taxonomy.ts`) exports course slugs+labels + `slugify` + the term-count/singleton-set; `content.config.ts` imports the slugs for its Zod enum (kills the duplication). Slugify does `&`→` and ` **before** punctuation stripping; Vitest covers `cajun-and-creole`.
- **Config-time scan** mirrors the loader's `['*.md','!TEMPLATE.md']` and adds `gray-matter` as a dev dep (explicit, simplest).
- **Search results**: dedicated serializable search-card shape + a small XSS-safe client renderer (title/meta via `textContent`, only Pagefind's own `excerpt` uses innerHTML, result URL validated to `^/recipes/`). Explicit `data-pagefind-meta` for all display fields.
- **Pagefind deploy caching**: `pagefind/**` excluded from the immutable pass, synced with short revalidation.
- **Lazy-load nuance**: focus-triggered globally, but `/search/` auto-runs when `?q=` is present.
- **/recipes/ facet set adds contributor** (IA consistency); **sort control is hidden-until-JS** over a deterministic A–Z static order (no-JS never sees a broken sort).
- **Breadcrumb axis segment is non-linking** (no axis index pages in scope) and omitted as a linked item from `BreadcrumbList`.

## Round 2 — Codex
Confirmed all 13 R1 findings addressed. Remaining:
- High: sitemap `filter(value)` receives **absolute** URLs; the singleton exclusion set must be canonical absolute URLs w/ trailing slash (`new URL(path, site).href`).
- High: Categories nav is a JS dropdown with no no-JS fallback — conflicts with "no-JS browses fully." Fix: native `<details>/<summary>` (or link fallback) enhanced by JS.
- Medium: within-axis slug collisions are only a "risk," not enforced. Fix: `termIndex` fails the build on collision + a unit test.
- Medium: Pagefind build ownership muddy ("postbuild" + "wired into CI/deploy"). Fix: Pagefind in npm `postbuild` only; CI/deploy just call `npm run build`.
- Medium: multi-select query semantics underspecified. Fix: repeated params (`tag=a&tag=b`) via `getAll()`, sorted for stable URLs.
- Low: stale counts — repo has 116 tags / 6 contributors, not 118 / 7.

### Claude's response
All 6 accepted:
- Sitemap exclusion set built as **canonical absolute URLs** (`new URL(path, site).href`, trailing slash) to match what `@astrojs/sitemap` passes to `filter`.
- **Categories nav is a native `<details>/<summary>`** listing the course links (fully works no-JS); JS enhances it (Esc/outside-click close, focus mgmt). No-JS browse promise restored.
- **Slug collisions now fail the build**: `termIndex` throws on a within-axis slug collision; Vitest covers a colliding-label case. Moved from "risk" to a hard requirement.
- **Pagefind lives in npm `postbuild` only**; CI and deploy just run `npm run build` (deploy still owns *uploading* `dist/pagefind/` with short-cache headers, but never re-invokes pagefind directly).
- **Multi-select query = repeated params** (`tag=a&tag=b`) read via `URLSearchParams.getAll()`, values **sorted** for canonical/stable shareable URLs.
- **Dropped the hardcoded counts** from the plan (they rot); the build scan is the live source. Corrected the contributor mention to ~6.

## Round 3 — Codex
**VERDICT: APPROVED.** "No material implementation blockers remain." Three Low non-blocking nits:
- Low: risk section still said "118 tags" — make count-free.
- Low: sitemap helper should reuse `termIndex` (not just `slugify`) for a true single source.
- Low: facet URL/`data-*` values should be taxonomy **slugs**, not display labels, or `Cajun & Creole` desyncs from `cajun-and-creole`.

### Claude's response
Converged. Folded all three Low nits in anyway (cheap, no reason to ship known nits): tag-risk wording is now count-free; the config scan passes minimal records through the shared `termIndex`; facet `data-*`/query values are explicitly slugs (labels display-only). Plan locked.
