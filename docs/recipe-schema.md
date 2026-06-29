# Recipe file schema

The canonical structure for a recipe file. Every recipe is one Markdown file in
`recipes/` named `kebab-case-title.md`. Structured data lives in YAML **frontmatter**;
the Markdown **body** holds the optional headnote/story and free-form notes.

This schema is **schema.org/Recipe-aligned** (so we can generate JSON-LD at build) and
**structured enough to power the interactive features** (serving scaler, unit toggle,
tap-to-check, timers). See ADR [0002](./adr/0002-recipes-as-markdown-with-yaml-frontmatter.md).

> Validation: when the Astro site is scaffolded, this schema is enforced by a Zod
> Content Collection so malformed recipes fail the build. Keep this doc and the Zod
> schema in sync.

## Frontmatter fields

| Field | Required | Type | Notes |
|-------|----------|------|-------|
| `title` | ✅ | string | Display name, e.g. "Grandma's Apple Pie". |
| `description` | ✅ | string | Short headnote, 1–3 sentences. Used in cards + SEO. |
| `contributor` | ✅ | string | Who gave us this recipe / whose recipe it is, e.g. "Grandma Ruth". Basic attribution; full provenance is a later heritage phase. |
| `course` | ✅ | enum | **Course slug** from [`taxonomy.md`](./taxonomy.md) §1 (e.g. `dessert`, `main`, `side`, `breakfast`). Zod enum — build fails on unknown. Rendered with its label; → schema.org `recipeCategory`. |
| `cuisine` |  | string | Cuisine from [`taxonomy.md`](./taxonomy.md) §2 (e.g. `American`); reuse existing values. → `recipeCuisine`. |
| `tags` |  | string[] | lowercase-kebab keywords per [`taxonomy.md`](./taxonomy.md) §3; dietary tags (§4) also emit `suitableForDiet`. → schema.org `keywords`. |
| `image` |  | object | Hero photo: `{ src, alt }`. `src` is a path under the recipe's image folder; `alt` is meaningful alt text (not "photo of food"). |
| `servings` | ✅ | number | Base serving count the quantities are written for. Drives the scaler. |
| `yield` |  | string | Human yield text if not just servings, e.g. "2 dozen cookies", "1 nine-inch pie". |
| `prepTime` |  | ISO-8601 duration | e.g. `PT30M`. |
| `cookTime` |  | ISO-8601 duration | e.g. `PT1H`. |
| `totalTime` |  | ISO-8601 duration | e.g. `PT1H30M`. Compute if not given. |
| `ingredients` | ✅ | Ingredient[] | See below. Structured so we can scale + convert. |
| `instructions` | ✅ | Step[] | See below. |
| `notes` |  | string[] | Cook's notes / tips ("don't overmix"). Family lore ("Grandma added a pinch more") also fine here in lean v1; a dedicated Family Notes feature comes later. |
| `nutrition` |  | object | Optional, e.g. `{ calories: "320 kcal" }` → schema.org `NutritionInformation`. |
| `datePublished` |  | date | `YYYY-MM-DD`. Default to date added. |
| `dateUpdated` |  | date | `YYYY-MM-DD`. |

### Ingredient object

```yaml
- qty: 0.75          # number, optional (omit for "to taste"). Decimals, not fractions — the UI renders ¾.
  unit: cup          # optional. "" / omit for countable items (e.g. "3 eggs").
  item: sugar        # REQUIRED. The thing itself.
  prep: sifted       # optional. Non-scaling descriptor ("peeled and sliced", "room temp").
  grams: 150         # weight of THIS qty, in grams. Strongly preferred — powers the weight view (ADR-0008).
  gramsApprox: false # optional. true → rendered as "≈ 150 g" (e.g. a typical-size produce average).
  gramsSource: ""    # optional provenance, e.g. "King Arthur chart", "USDA FDC", "package". Aids trust.
  note: ""           # optional aside.
  section: For the filling   # optional. Groups ingredients under a heading; omit for ungrouped.
```

- **`grams` is the weight of the *as-authored* `qty`** (not per-unit). Scaling multiplies
  `qty` and `grams` together.
- **Populate `grams` whenever it can be determined with confidence** — the intake agent
  researches this (ADR-0008, `docs/agents/intake.md`). Store it for **every** ingredient
  where a credible standard weight exists, not just baking. Omit (don't guess) when
  uncertain; use `gramsApprox: true` for confident-but-typical averages (e.g. "1 medium
  onion ≈ 110 g").
- **`prep` text never scales.** The unit toggle converts volume units (cup/tbsp/tsp/ml/l,
  oz/lb/g/kg) and uses `grams` for the **weight** view (see `docs/scaling-and-units.md`).

### Step object

A step is either a plain string, or an object when it has a section heading or a timer:

```yaml
instructions:
  - "Preheat the oven to 425°F (220°C)."          # simple string step
  - text: "Bake until golden."                     # object form
    section: Bake                                   # optional grouping heading
    timer: PT1H                                     # optional ISO-8601 → tappable in-page timer
```

- Each step is independently **tap-to-check**.
- A `timer` makes the duration tappable to start a countdown without leaving the page.
- Mention temperatures in both °F and °C in the text for now.

## Body (Markdown)

Everything after the frontmatter is optional free prose: a longer story/headnote, history,
or serving suggestions. Keep the *short* version in `description`; put anything longer
here so it never blocks the recipe card. A "Read more" disclosure renders this on the page.

## Conventions

- **File name** = `kebab-case` of the title, e.g. `grandmas-apple-pie.md`. This is the URL slug.
- **Images** live alongside in `recipes/images/<slug>/` (e.g. `recipes/images/grandmas-apple-pie/hero.jpg`); reference as `hero.jpg` in `image.src`. Optimized at build (AVIF/WebP) and committed. **Strip EXIF/GPS before committing** (`exiftool -all= -overwrite_original_in_place <file>`).
- **Durations** are always ISO-8601 (`PT`, then hours `H` / minutes `M`): `PT15M`, `PT1H30M`.
- **Don't hand-write JSON-LD** — it's generated from these fields at build.

See [`recipes/TEMPLATE.md`](../recipes/TEMPLATE.md) for a copy-paste skeleton and
[`recipes/grandmas-apple-pie.md`](../recipes/grandmas-apple-pie.md) for a worked example.
