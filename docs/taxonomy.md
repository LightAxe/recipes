# Taxonomy

*Drafted 2026-06-29. The controlled vocabulary that keeps browse coherent and intake
consistent. Feeds the Categories nav, the home tiles, the `/category|cuisine|tag|from`
pages (`information-architecture.md`), and the schema.org mapping. Referenced by
`recipe-schema.md`; enforced where noted by the Zod content schema.*

There are four classification axes: **course** (required, one), **cuisine** (optional,
one), **tags** (optional, many), and **contributor** (optional, one).

## 1. Course — required, exactly one (controlled enum)

The primary "what kind of dish." **Closed list** — the Zod schema rejects unknown values
(add new courses here deliberately, not ad hoc). Each has a slug (URL + nav) and a label.

| Slug | Label | Notes |
|---|---|---|
| `breakfast` | Breakfast & Brunch | incl. pancakes, eggs, casseroles |
| `appetizer` | Appetizers & Snacks | dips, finger food, nibbles |
| `soup` | Soups & Stews | incl. chili |
| `salad` | Salads | |
| `main` | Main Dishes | the centerpiece / entrée |
| `side` | Side Dishes | vegetables, starches, accompaniments |
| `bread` | Breads & Rolls | quick breads, yeast breads, biscuits |
| `dessert` | Desserts | cakes, pies, puddings, candies (**not** cookies — see below) |
| `cookies` | Cookies & Bars | cookies, bars, brownies |
| `drink` | Drinks | hot & cold, incl. punches |
| `sauce` | Sauces & Condiments | dressings, gravies, rubs, jams-as-topping |
| `canning` | Canning & Preserves | jams, jellies, pickles, anything put up by canning |
| `other` | Other | catch-all; avoid — prefer a real course |

- **Exactly one** course per recipe (the primary one). Cross-classification (e.g. a
  dessert bread) is handled with **tags**, not multiple courses.
- **Cookies & Bars** is deliberately split out from Desserts (it's a big part of the
  collection); **Canning & Preserves** is its own course (the family book has a canning
  section).
- These are the candidate **Categories nav** items and **home browse tiles** (each with an
  ingredient/category spot illustration per `design.md`) — but see the empties rule below.

### Only non-empty courses appear

**Never show a course that has zero recipes.** The Categories nav and the home tiles are
generated from the actual content — a course materializes the moment its first recipe
exists and disappears if it ever has none. So the table above is the *allowed* set; the
*visible* set is always "courses with ≥1 published recipe." (Same rule applies to cuisine,
tag, and contributor browse pages — no empty taxonomy pages are generated.)

## 2. Cuisine — optional, one (open list, guided)

The culinary tradition. Free string but **prefer an existing value** for coherent
`/cuisine/<slug>/` pages. Proper-case label; slug is lowercased/kebab. Starter set:

`American`, `Southern`, `Cajun & Creole`, `Tex-Mex`, `Mexican`, `Brazilian`, `Italian`,
`French`, `Swiss`, `German`, `Scandinavian`, `Jewish`, `Greek & Mediterranean`, `Chinese`,
`Japanese`, `Thai`, `Indian`, `Middle Eastern`, `Caribbean`.

- Omit if a recipe has no meaningful cuisine (many family staples are just "American" or
  none — that's fine; don't force it).
- Intake should reuse an existing cuisine before coining a new one; new ones get added to
  this list when first used.

## 3. Tags — optional, many (free, with conventions)

Reusable keywords for cross-cutting discovery. **lowercase-kebab-case.** Reuse existing
tags before inventing new ones (intake checks the current tag set). Use tags for:

- **Occasion:** `thanksgiving`, `christmas`, `easter`, `potluck`, `weeknight`, `birthday`
- **Season:** `fall`, `winter`, `spring`, `summer`
- **Main ingredient:** `apple`, `chicken`, `chocolate`, `zucchini` (the headline one or two)
- **Method/equipment:** `no-bake`, `grilled`, `slow-cooker`, `one-pot`, `freezer-friendly`
- **Attribute:** `kid-friendly`, `make-ahead`, `budget`, `crowd-size`, `heirloom`
- **Dietary:** see §4 (these are special — they also drive JSON-LD)

Don't: duplicate the course or cuisine as a tag; create near-duplicates (`slowcooker` vs
`slow-cooker`); over-tag (aim ~3–8 meaningful tags).

## 4. Dietary tags — controlled subset (drive schema.org)

A recognized subset of tags. When present, the build also emits schema.org
`suitableForDiet` so the recipe is correctly described for search/diet filters.

| Tag | schema.org `suitableForDiet` |
|---|---|
| `vegetarian` | `https://schema.org/VegetarianDiet` |
| `vegan` | `https://schema.org/VeganDiet` |
| `gluten-free` | `https://schema.org/GlutenFreeDiet` |
| `dairy-free` | `https://schema.org/LowLactoseDiet` *(closest enum)* |
| `kosher` | `https://schema.org/KosherDiet` |
| `halal` | `https://schema.org/HalalDiet` |

- `low-sugar`, `nut-free`, `egg-free`, etc. are valid **family-facing tags** but have no
  accurate schema.org
  enum — they just don't add a `suitableForDiet` entry.
- **Accuracy matters:** only apply a dietary tag if the recipe truly qualifies as written
  (intake should not guess — when unsure, omit and ask).

## 5. Contributor — optional, one (slugified)

Who the recipe is from (`contributor` field). Drives the byline and the optional
`/from/<slug>/` page. **Optional:** many cards in the family book carry no name — when
the source has no attribution and the maintainer hasn't supplied one, **omit the field
entirely**. Never invent a name or a generic placeholder (no "Ogilvie Family", "Unknown",
etc.) — an absent byline is correct and a missing-attribution recipe simply doesn't appear
on any `/from/` page until someone is credited.

- **Slug** = lowercase, kebab, accents stripped: "Grandma Ruth" → `grandma-ruth`;
  "Aunt Lucia" → `aunt-lucia`.
- Use a **consistent display form** per person (always "Grandma Ruth", not sometimes
  "Ruth O." / "Grandma") so their page collects everything. Keep a running list as people
  are added; disambiguate collisions explicitly (e.g. `grandma-ruth-ogilvie`).

## 6. Slugification rules (all axes)

Lowercase → trim → strip accents/diacritics → replace non-alphanumerics with `-` →
collapse repeats → trim leading/trailing `-`. Ampersands become `and` where they'd
otherwise vanish (e.g. "Cajun & Creole" → `cajun-and-creole`). Slugs are **stable**: once
published, keep a redirect if a label is ever reworded.

## 7. schema.org mapping

| Our field | schema.org |
|---|---|
| `course` | `recipeCategory` (the label) |
| `cuisine` | `recipeCuisine` |
| `tags` | `keywords` (comma-joined) |
| dietary tags (§4) | `suitableForDiet` |
| `contributor` | `author` (`Person`) |

## 8. Enforcement

- **`course`** → Zod **enum** (build fails on an unknown value). The single source of the
  enum is §1.
- **`cuisine`** → string; a build **warning** (not error) if it's not in the §2 list, to
  catch typos while allowing growth.
- **`tags`** → `string[]`, validated as kebab-case; a build note lists any **brand-new**
  tag so we can catch near-duplicates before they fragment browse.
- **dietary tags** → recognized against §4 to generate `suitableForDiet`.

## 9. Decisions & open questions

**Resolved (2026-06-29):** course list blessed with two changes — **Cookies & Bars** split
from Desserts, and **Canning & Preserves** as its own course; plus the **only-non-empty**
rule (§1) so unused sections never appear.

**Still open:** whether to surface **dietary** and **occasion** tags as their own browse
sections on the home page, or keep all tags under `/tag/<slug>/` only.
