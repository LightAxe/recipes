# Information Architecture

*Drafted 2026-06-29. The site map, URL structure, navigation, and page inventory for
Ogilvie Family Recipes. Builds on `architecture.md` (static Astro, progressive
enhancement), `design.md` (Counter), and `recipe-schema.md`. Living document.*

## 1. Principles

- **Recipe-first & shallow.** Any recipe is ≤2 clicks from the home page. Navigation is
  flat and plain-language (cross-gen research: both search *and* browse, no deep menus).
- **Durable, human-readable URLs.** Lowercase, kebab-case, trailing slash, no dates or IDs
  in recipe URLs (a recipe's URL shouldn't change if we re-categorize it).
- **Every list page is a real page** (static, indexable, shareable) — not a JS-only filter.
- **One controlled vocabulary** drives browse (see `recipe-schema.md`; full taxonomy is a
  follow-up doc).

## 2. Site map

```
/                                   Home
├── /recipes/                       All recipes (browse + facets)
│   └── /recipes/<slug>/            A recipe (e.g. /recipes/grandmas-apple-pie/)
├── /category/<course>/             By course   (e.g. /category/dessert/)
├── /cuisine/<cuisine>/             By cuisine  (e.g. /cuisine/american/)
├── /tag/<tag>/                     By tag      (e.g. /tag/thanksgiving/)
├── /from/<contributor>/           By contributor (e.g. /from/grandma-ruth/)
├── /tips/                          Cooking tips & reference hub
│   ├── /tips/<slug>/               A tip / how-to
│   └── /tips/conversions/          Conversion charts (cups⇄grams, °F⇄°C, gas mark)
├── /search/                        Search (client-side index)
├── /about/                         The collection's story + how to contribute
└── (utility) /404, /sitemap-index.xml (+ /sitemap-0.xml), /rss.xml, /robots.txt
```

## 3. URL conventions

| Pattern | Example | Notes |
|---|---|---|
| Recipe | `/recipes/grandmas-apple-pie/` | slug = file name; **stable for life** |
| Course | `/category/dessert/` | one course per recipe (primary) |
| Cuisine | `/cuisine/american/` | optional field |
| Tag | `/tag/thanksgiving/` | many per recipe |
| Contributor | `/from/grandma-ruth/` | slugified `contributor` |
| Tip | `/tips/how-to-blind-bake/` | |

- Taxonomy pages are **generated from recipe frontmatter** (Astro `getStaticPaths`), so
  they always reflect the content with no manual upkeep.
- Redirects: if a recipe is ever renamed, leave a redirect from the old slug (CloudFront /
  static redirect) — URLs are forever.

## 4. Global navigation

**Header (every page), ≤5 primary items to stay shallow:**

`[petal] Ogilvie Family Recipes` (home) · **Recipes** · **Categories** · **Tips** ·
**About** · 🔍 search field (visible, open, not behind an icon) · 🌗 theme toggle.

- "Categories" opens a simple plain-language list of courses (Mains, Sides, Desserts,
  Cookies & Bars, Breads, Canning & Preserves…), not a mega-menu. **Only courses that have
  at least one recipe appear** (per `taxonomy.md`) — same for the home tiles and every
  `/category|cuisine|tag|from` page (no empty sections are ever generated).
- On mobile: wordmark + a large hamburger that reveals the same links as a full-screen
  sheet (button-driven, never hover/gesture-only); search stays reachable.

**Breadcrumbs** on recipe/category/cuisine/tag/tip pages, e.g.
`Home › Desserts › Grandma's Apple Pie` — orientation + a second way to navigate (WCAG 2.4.5).

**Footer (every page):** the enamel strip with `© 2026 Ogilvie Family` + the universe line
("Part of the *axpr* cinematic universe"); plus quick links (Recipes, Categories, Tips,
About, RSS) and a short "Add a recipe — email Rob" line.

## 5. Page inventory

### Home `/`
- **Hero:** wordmark + warm one-line tagline + the search field.
- **Browse by category:** enamel **tiles** (one per **non-empty** course, with an
  ingredient/category spot) — the primary browse entry.
- **Latest additions:** a few recent recipe cards (uses `datePublished`).
- **From the family:** optional highlight of a contributor or a featured recipe.
- **Tips teaser** → `/tips/`. Keep it short; the home page should breathe.

### All recipes `/recipes/`
- Grid of **recipe cards**. Faceted browse by course / cuisine / tag / contributor and a
  sort (Newest, A–Z). Facets are **real links** to the taxonomy pages above; an optional
  JS layer can filter in-place, but the no-JS path is browsing via those links.
- `ItemList` JSON-LD for the collection.

### Recipe `/recipes/<slug>/`
The full experience from `design.md` §7 / `architecture.md` §5: recipe card (hero, meta
byline incl. **contributor** linked to `/from/<contributor>/`), Cook Mode, scaler, unit
toggles, tap-to-check ingredients & steps, timers, notes, optional story body, print +
4×6. Emits **Recipe JSON-LD**. Breadcrumb. "More from <contributor>" and "More <course>"
links at the foot.

### Taxonomy pages `/category/…`, `/cuisine/…`, `/tag/…`, `/from/…`
- H1 = the term (e.g. "Desserts", "From Grandma Ruth"), an optional one-line description,
  then a grid of matching recipe cards. `ItemList` JSON-LD. These make the collection
  browsable and give every recipe multiple discovery paths.

### Tips hub `/tips/` and tip `/tips/<slug>/`
- Hub: cards for technique/how-to articles + a prominent link to **Conversions**.
- Tip page: article layout (Atkinson body, Fredoka headings, petal dividers); recipes can
  deep-link into tips inline ("blind bake" → `/tips/how-to-blind-bake/`).
- `/tips/conversions/`: the cups⇄grams (per-ingredient), °F⇄°C⇄gas-mark, and common-tin
  reference tables.

### Search `/search/`
- Client-side over a static index (**Pagefind** recommended — it generates the index at
  build, zero backend, tiny runtime). Results show recipe cards. If JS is off, the page
  guides users to browse via Categories. (Scope: ship at v1 if cheap; otherwise browse-first.)

### About `/about/`
- The story of the collection, the family character, and **how to contribute** (email Rob;
  he adds it via Claude Code per `agents/intake.md`). A natural home for provenance notes.

## 6. Content → route mapping

| Content collection | Drives |
|---|---|
| `recipes/*.md` | `/recipes/<slug>/`, and (via frontmatter) all `/category`, `/cuisine`, `/tag`, `/from` pages, home lists, search index, sitemap, RSS |
| `tips/*.md` (new collection) | `/tips/`, `/tips/<slug>/` |
| `tips/conversions` (page or data) | `/tips/conversions/` |

Taxonomy routes use `getStaticPaths` over the recipe collection — **no separate taxonomy
files to maintain**.

## 7. SEO, feeds, discovery

- **Sitemap** (`@astrojs/sitemap`) including all recipe + taxonomy + tip pages.
- **RSS** (`/rss.xml`) of newly added recipes (universe convention).
- Canonical URLs, Open Graph/Twitter cards (hero image, title, description), per-page
  titles. `robots.txt` allows indexing (public site, ADR-0004).
- Recipe pages: `Recipe` JSON-LD; list pages: `ItemList`; site: `WebSite` + `BreadcrumbList`.

## 8. Decisions & open questions

**Resolved (2026-06-29):**
- **Search at v1: yes — Pagefind** (build-time static index; browse still works without JS).
- **Contributor pages at v1: yes (optional/nice-to-have)** — generated from the
  `contributor` field at `/from/<slug>/`; ship if cheap, never a blocker.
- **Course controlled vocabulary** — defined in [`docs/taxonomy.md`](./taxonomy.md).

**Still open:**
- **Categories menu vs. page.** Header dropdown list vs. a dedicated `/categories/` index
  page (or both). Leaning: a simple dropdown + the home tiles; add an index page only if
  the course list grows.
