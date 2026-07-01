# Component Inventory

*Drafted 2026-06-29. The implementation contract for every UI component: anatomy, states,
accessibility (roles/ARIA/keyboard), behavior (incl. the no-JS path), and which design
tokens it uses. Realizes `design.md` (Counter) across the pages in
`information-architecture.md`. When built (Astro), these live in `src/components/` with
behavior in `src/scripts/`.*

**Conventions for every component below**
- **Tokens only** — no hard-coded colors/sizes; reference `design.md` §2/§4 semantic tokens.
- **A11y baseline (always):** visible focus ring (3px `--color-focus`, 2px offset); hit
  area ≥48px; ≥4.5:1 text contrast in both themes; no hover-only meaning; motion gated by
  `prefers-reduced-motion`; decorative SVG `aria-hidden`.
- **Progressive enhancement** — each notes its **no-JS** behavior. Nothing essential
  requires JS.

---

## A. Interactive primitives

### A1. Button (`.btn`)
- **Variants:** `primary` (tomato-strong fill, white text, `--shadow-tin`), `secondary`
  (cream-raised fill, steel rim), `ghost` (text + teal-ink), `icon` (square ≥48px).
- **States:** rest / hover (slight lift) / **active** (the "tin press": translate 2px,
  shadow collapses) / focus-visible (ring) / disabled (reduced opacity, `aria-disabled`).
- **A11y:** real `<button>`/`<a>`; never a bare `<div>`. Icon buttons need `aria-label`.
- **Tokens:** `--color-action`, `--radius-pill`, `--shadow-tin`.

### A2. Segmented control (`.segmented`) — used by Scaler
- Row of pill segments; one selected. **Roles:** `radiogroup` + `role="radio"`
  (`aria-checked`); arrow keys move selection, Enter/Space select. Selected = tomato fill.
- **No-JS:** renders showing the base/default segment; non-interactive (the page already
  shows base amounts).

### A3. Toggle (`.toggle`) — used by Unit toggles, Theme toggle
- Two-state pill (`aria-pressed`) or a two-option switch (`role="switch"`). Label always
  visible or `aria-label`. Keyboard: Enter/Space.

### A4. Chip (`.chip`) — Timer chips, facet pills
- Compact rounded label; may be a button (timer) or link (facet). Outline (tomato) or
  fill. ≥44px tall on touch.

### A5. Disclosure (`.disclosure`) — Story "read more", scaling caveat
- `<button aria-expanded>` controlling a region; chevron/petal rotates. **No-JS:** use
  `<details>/<summary>` so it still expands.

---

## B. Global / layout

### B1. BaseLayout
- `<head>`: meta, canonical, OG/Twitter, fonts (`@fontsource`), the **pre-paint theme
  script** (sets `data-theme` from `localStorage`→`prefers-color-scheme`), Cloudflare
  Analytics, page-appropriate JSON-LD slot.
- Body: **skip-to-content link** (first focusable), `<header>`, `<main id="main">`,
  `<footer>`. Sets the checker backsplash atmosphere behind content.

### B2. Header / Nav
- Wordmark (B3) · primary links (Recipes, Categories, Tips, About) · SearchField · ThemeToggle.
- **Desktop:** horizontal, ≤5 items. **Mobile:** wordmark + a ≥48px hamburger `<button
  aria-expanded aria-controls>` opening a full-screen sheet with the same links (focus
  trapped while open, Esc closes, returns focus). **No-JS:** hamburger is a `<details>` or
  an anchor to a footer nav; links always reachable.
- "Categories" is a simple disclosure listing **only non-empty courses** (`taxonomy.md`).
- `<nav aria-label="Primary">`; current page `aria-current="page"`.

### B3. Wordmark / Logo
- Petal mark (SVG, `aria-hidden`) + **"Ogilvie Family Recipes"** in Fredoka; whole thing a
  link to `/` with an `aria-label`. Scales down to mark-only on narrow mobile.

### B4. ThemeToggle
- Toggle (A3) Counter ⇄ Night Kitchen; sun/pot ⇄ moon petal glyph. Persists to
  `localStorage`; flips `data-theme`. `aria-pressed` + label "Switch to dark/light".
  **No-JS:** hidden (CSS `prefers-color-scheme` still themes the page).

### B5. SearchField + Results
- Visible open `<input type="search">` (not behind an icon) with a label; submits to
  `/search/`. Pagefind powers results as a **CardGrid** of RecipeCards with highlighted
  matches. **No-JS:** the field still submits to `/search/`, which shows a "browse by
  category" fallback. (`information-architecture.md` §5.)

### B6. Footer (universe)
- Enamel checker strip. Left: `© 2026 Ogilvie Family`. Quick links + RSS. "Add a recipe —
  email Rob." Right, DM Mono small caps: **"Part of the [axpr](https://axpr.net) cinematic
  universe"** (petal glyph before `axpr`, colored `--tomato-ink`; underline on hover+focus).
  Matches every sibling's words, dressed as enamelware (`design.md` §7).

### B7. Breadcrumbs
- Shared `Breadcrumbs.astro`: `<nav aria-label="Breadcrumb"><ol>` with `›` separators; links
  underlined (distinct from non-link segments); last item `aria-current`. Intermediate items
  without an `href` render as a non-linking segment (the taxonomy axis label, which has no index
  page) — these are dropped from the `BreadcrumbList` JSON-LD, so the visible trail can be one
  item longer than the structured data. On recipe, recipes-index, taxonomy, tips-index, tip,
  conversions, and about pages.

---

## C. Recipe page

### C1. RecipeCard (grid)
- The "little enamel dish": cream-raised, steel rim, glossy highlight, `--radius-lg`.
  Anatomy: hero thumb (checker top strip) · title (Fredoka) · mono meta (time · serves) ·
  course chip. Entire card is **one link** (title is the accessible name); hover/focus
  lifts. Lazy-loaded thumb with width/height set.

### C2. RecipeHero
- Eager (LCP) responsive `<picture>` (AVIF/WebP/JPEG, `srcset`/`sizes`), checker strip
  framing the top edge. Meaningful `alt` (from `image.alt`). Width/height set (no CLS).

### C3. RecipeMeta (byline + stats)
- DM Mono row with **petal separators**: `PREP 30m · COOK 1h · SERVES 8`. Byline:
  "from **Grandma Ruth**" linking `/from/grandma-ruth/`. Times rendered from ISO-8601 to
  human text; `<time datetime>` used.

### C4. ScalerControl
- Label "Makes" + Segmented (A2) `1× 2× 3×` + an editable serving `<input type="number">`
  (min/step, `aria-label`). Drives `scaling.ts`. Shows the **caveat disclosure** when
  factor ≠ 1 (`scaling-and-units.md` §2). **No-JS:** shows base servings, static.

### C5. UnitToggles
- Two toggles (A3): **System** US⇄Metric, **Measure** Volume⇄Weight. The **Weight** toggle
  is **gated per recipe** (`scaling-and-units.md` §4) — hidden when the recipe lacks enough
  `grams`. A remembered **"prefer weight"** preference defaults a well-covered recipe to
  the weight view (ADR-0008); produce-by-count with researched grams shows by weight too.
  Drives `units.ts`. **No-JS:** as-authored units.

### C6. IngredientGroup
- Optional section (`section` field) as a **tile tab** (sand fill, rounded top) with the
  ingredient spot illustration + group name. Wraps an IngredientList.

### C7. IngredientList / IngredientItem
- `<ul>` of items. Each **IngredientItem** is a ≥48px **tap-to-check** row:
  `role="checkbox"`/`aria-checked` (or a real checkbox + label). Anatomy: petal bullet
  (decorative) · **qty span** (DM Mono, `tabular-nums`, carries `data-qty/-unit/-grams/
  -count`) · item text · optional `prep`/`note` muted. Checked → butter wash + teal
  petal-check + strikethrough; state optional-persists per recipe in `localStorage`.
- **No-JS:** plain readable list at base amounts (checkbox simply won't persist).

### C8. StepList / StepItem
- `<ol>` of steps. Each **StepItem**: number badge, step text (lead size), independently
  **tap-to-check** (native checkbox; dims/strikes when done). A step's `timer` duration
  shows as **plain text** beside it.

### C9. ~~TimerChip~~ — dropped
- **No in-page timers** (ADR-0012): people use their own kitchen/voice timers. Step
  durations are display-only text. (Section kept as a pointer; there is no timer component.)

### C10. NotesBlock
- "Cook's notes / Family notes" — distinct callout (butter-tinted, petal marker), each
  note from the `notes[]` array, verbatim. Preserves family lore (`recipe-schema.md`).

### C11. StoryDisclosure
- The Markdown body (longer story) behind a "Read the story" disclosure (A5) so it never
  blocks the recipe. **No-JS:** `<details>` open-able.

### C12. CookModeBar + CookMode view
- Sticky bar with a big **Cook Mode** primary button. Engaging it:
  - requests **Screen Wake Lock** (re-acquire on `visibilitychange`, release on exit;
    "screen stays on" note); `cookmode.ts`.
  - switches to a **focused layout**: one large step at a time (≥lead size), big Prev/Next
    (≥48px), dimmed chrome/backsplash, step counter, ingredients reachable.
  - Exit always one obvious control; restores scroll position + focus.
- `aria-pressed` on the toggle; the focused view is keyboard-navigable (←/→ between steps).
  **No-JS:** button hidden; the normal numbered steps already work.

### C13. PrintButton
- Button offering **Print** and **4×6 card**. Calls `window.print()` after setting a body
  class (`print-standard` / `print-card`) the print stylesheet reads
  (`design.md` §7). Printed output reflects current scale/units. **No-JS:** the browser's
  own print still works via the `@media print` sheet.

### C14. RecipeFooterLinks
- "More from **Grandma Ruth**" and "More **Desserts**" card rows at the foot, linking the
  `/from/` and `/category/` pages.

---

## D. List / taxonomy / utility

### D1. PageHeader
- H1 (the term: "Desserts", "From Grandma Ruth"), optional one-line description, optional
  category spot illustration. Used on all taxonomy/list pages.

### D2. CardGrid
- Responsive grid of RecipeCards (1 col mobile → 2–3+ by breakpoint, fluid). Emits
  `ItemList` JSON-LD. Lazy-loads thumbs.

### D3. FacetNav
- Plain-language links to courses/cuisines/tags/contributors (**real links** to taxonomy
  pages; only **non-empty** facets shown). An optional JS layer filters in place, but
  links are the no-JS path.

### D4. SortControl
- `<select>` (Newest / A–Z). **No-JS:** default order (newest) is server-rendered; the
  select is a same-page enhancement.

### D5. EmptyState
- Friendly petal illustration + message. For zero search results (guides to browse).
  (Taxonomy pages are never empty — they aren't generated when empty.)

### D6. TipArticle
- Article layout: Fredoka headings, Atkinson body, petal dividers, inline links from
  recipe terms. Used by `/tips/<slug>/`. `/tips/conversions/` is a TipArticle whose body
  is the conversion tables (single source with `scaling-and-units.md` constants).

---

## E. Decorative (non-semantic, `aria-hidden`)

### E1. Petal / Lotus
- One SVG, reused as bullet, the check-bloom, separators, the mark. Color via `currentColor`
  so it adapts to context/theme.

### E2. PetalDivider
- A centered row of alternating teal/tomato petals between sections (and in print).

### E3. TileBacksplash
- Low-contrast `--sand`/`--cream` checkerboard behind hero/footer/section breaks; dims in
  cook mode. CSS gradient/SVG, no extra requests.

### E4. IngredientSpot
- Hand-drawn 2px-ink + one-accent-fill spots from the starter set (`flour, egg, apple,
  butter, pot, whisk, lemon, jar`); used in IngredientGroup tabs and category headers/
  tiles. Style spec in `design.md` §5. Always decorative (alt empty / `aria-hidden`).

---

## F. Build order hint
Primitives (A) + BaseLayout/Header/Footer (B) → RecipeCard + CardGrid → the Recipe page
(C2–C11, static) → interactivity (C4/C5/C7/C8/C9/C12, the `src/scripts` + `src/lib`) →
taxonomy/list pages (D) → search + tips. Matches the phases in `architecture.md` §14.
