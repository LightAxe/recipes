# Recipe Data Formats: Research for a Long-Lived Family Recipe Archive

*Compiled 2026-06-29. Focus: which structured-data formats for recipes have stood the test of time, and which to choose for a decades-long family collection grown by emailed contributions.*

---

## 1. schema.org/Recipe (JSON-LD) — the web-presentation standard

### What it is
`Recipe` is a type in the [schema.org](https://schema.org/) vocabulary, the cross-industry structured-data standard founded in 2011 by Google, Microsoft (Bing), Yahoo, and Yandex. It is normally embedded in an HTML page as a `<script type="application/ld+json">` block (JSON-LD), though Microdata and RDFa are also valid serializations. Google consumes it to produce **Recipe rich results** (the cards with photo, star rating, time, and calories) and to feed Google's recipe carousels and Assistant guided cooking.

In the schema.org type hierarchy, `Recipe` is a subtype of **HowTo**, which is a subtype of **CreativeWork → Thing**. That inheritance matters: many "recipe" fields are actually inherited.

### Fields (current as of schema.org v30.0, 2026-03)
Source: <https://schema.org/Recipe>

**Defined directly on `Recipe`:**
- `recipeIngredient` — Text (one entry per ingredient line; e.g. "3 cups flour")
- `recipeInstructions` — Text, an `ItemList`, or a list of `HowToStep` / `HowToSection` objects
- `recipeYield` — Text or `QuantitativeValue` (e.g. "4 servings")
- `recipeCategory` — Text (e.g. "Dessert", "Main course")
- `recipeCuisine` — Text (e.g. "Italian", "Cajun")
- `cookTime` — Duration in **ISO 8601** (e.g. `PT1H` = 1 hour)
- `cookingMethod` — Text (e.g. "Steaming", "Frying")
- `nutrition` — `NutritionInformation` object (`calories`, `fatContent`, `proteinContent`, `carbohydrateContent`, `sodiumContent`, `servingSize`, etc.)
- `suitableForDiet` — `RestrictedDiet` enum (e.g. `VeganDiet`, `GlutenFreeDiet`)

**Inherited from `HowTo`:**
- `prepTime` — Duration ISO 8601 (e.g. `PT20M`)
- `totalTime` — Duration ISO 8601
- `performTime`, `estimatedCost`, `supply`, `tool`, `step`, `yield`

**Inherited from `CreativeWork`:**
- `name`, `description`, `image`, `author` (`Person`/`Organization`), `datePublished`, `keywords`, `aggregateRating` (`AggregateRating`), `review`, `video` (`VideoObject`), `inLanguage`

**ISO 8601 duration reminder:** `PT15M` (15 min), `PT1H30M` (1 h 30 min), `P0DT0H30M` are all valid. This is the single most common authoring mistake.

### Example snippet
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org/",
  "@type": "Recipe",
  "name": "Grandma's Apple Pie",
  "author": { "@type": "Person", "name": "Jane Doe" },
  "datePublished": "2026-06-29",
  "image": ["https://example.com/photos/apple-pie.jpg"],
  "description": "A family apple pie passed down three generations.",
  "recipeCuisine": "American",
  "recipeCategory": "Dessert",
  "keywords": "apple pie, dessert, family recipe",
  "prepTime": "PT30M",
  "cookTime": "PT1H",
  "totalTime": "PT1H30M",
  "recipeYield": "8 servings",
  "recipeIngredient": [
    "6 apples, peeled and sliced",
    "3/4 cup sugar",
    "2 tbsp flour",
    "1 tsp cinnamon",
    "2 pie crusts"
  ],
  "recipeInstructions": [
    { "@type": "HowToStep", "text": "Preheat oven to 425°F (220°C)." },
    { "@type": "HowToStep", "text": "Mix apples with sugar, flour, and cinnamon." },
    { "@type": "HowToStep", "text": "Fill crust, cover, bake 1 hour." }
  ],
  "nutrition": { "@type": "NutritionInformation", "calories": "320 calories" },
  "aggregateRating": {
    "@type": "AggregateRating", "ratingValue": "4.8", "reviewCount": "27"
  }
}
</script>
```

### Adoption, longevity, tooling
- **Dominant for the web.** It is the standard Google documents and validates for recipe rich results. See Google's [Recipe structured data guide](https://developers.google.com/search/docs/appearance/structured-data/recipe) and the general [intro to structured data](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data).
- **Required vs. recommended:** Google requires `name`, `image`, and (for rich results eligibility) recommends the time/yield/nutrition/rating fields. Valid JSON-LD does not *guarantee* display — Google decides — but it is the only route to a recipe rich card.
- **Longevity:** 15 years old (since 2011) and continuously versioned (v30.0 in 2026). Backed by the major search engines. This is as "safe bet" as web metadata gets.
- **Tooling:** [Google Rich Results Test](https://search.google.com/test/rich-results), the [Schema Markup Validator](https://validator.schema.org/), plus countless generators and WordPress plugins (WP Recipe Maker, Tasty Recipes, etc.) that emit it automatically.
- **Caveat:** It is a *presentation/interchange* format meant to be generated from your real data, not hand-authored as your source of truth. It is verbose and JSON, so it is poor for non-technical contributors to write by hand.

---

## 2. Microformats h-recipe (hRecipe) — the historical HTML approach

Source: <https://microformats.org/wiki/h-recipe> and <https://microformats.org/wiki/hrecipe>

### What it is
A way to annotate ordinary HTML with `class` attributes so the recipe is both human-visible and machine-readable, with no separate data block. Originally **hRecipe** (microformats1), reformulated as **h-recipe** in microformats2.

**Core properties:**
- `p-name` (recipe title; classic: `fn`)
- `p-summary`
- `p-ingredient` (classic: `ingredient`)
- `e-instructions`
- `p-yield`
- `dt-duration` (uses ISO 8601 via the value-class-pattern)
- `u-photo`
- experimental: `p-author`, `dt-published`, `p-nutrition`

### Example
```html
<div class="h-recipe">
  <h1 class="p-name">Grandma's Apple Pie</h1>
  <p class="p-summary">A family apple pie.</p>
  <ul>
    <li class="p-ingredient">6 apples, sliced</li>
    <li class="p-ingredient">3/4 cup sugar</li>
  </ul>
  <div class="e-instructions"><p>Bake at 425°F for 1 hour.</p></div>
  <time class="dt-duration" datetime="PT1H30M">1.5 hours</time>
</div>
```

### History and current status
- Driven in part by Google's old **recipe view / recipe search** feature (~2011), which read hRecipe; the experimental `summary`, `author`, `published`, and `nutrition` properties got real-world adoption specifically because of that Google support.
- The microformats wiki still lists h-recipe as "ready to use and implemented in the wild" and recommends dual-marking with classic `hRecipe` class names for backward compatibility.
- **Practical status: legacy.** The web (and Google) decisively moved to schema.org/JSON-LD for recipe rich results. h-recipe lives on mainly in the [IndieWeb](https://indieweb.org/recipe) community. It still works and parsers exist, but it is no longer the path to Google rich cards and has a much smaller ecosystem. Not recommended as a primary store for a new archive.

---

## 3. Plain-text / markup formats (source-of-truth candidates)

These are formats you would actually *author and version-control*, then convert to schema.org for the web.

### 3a. Cooklang
Sources: <https://cooklang.org/> · spec <https://cooklang.org/docs/spec/> · [GitHub org](https://github.com/cooklang) · [awesome-cooklang](https://github.com/cooklang/awesome-cooklang)

A `.cook` plain-text file is the recipe written as natural-language instructions with inline markup:
- `@` marks an **ingredient**; multi-word names close with `{}`; quantity goes in `{}`, unit after `%`
- `#` marks **cookware**
- `~` marks a **timer**
- `--` is a comment, `>>` sets metadata, `==Section==` for sections, `(prep notes)` after an ingredient

**Example (`apple-pie.cook`):**
```cook
>> servings: 8
>> time: 1.5 hours

Mix @apples{6}(sliced) with @sugar{0.75%cup} and @cinnamon{1%tsp}.
Fill a #pie dish, bake for ~{1%hour} at 425°F.
```
The ingredient list and shopping list are *derived automatically* from the inline markup — you never maintain a separate ingredients block.

- **Pros:** Extremely readable; instructions and ingredients are one source; auto-generated shopping lists/scaling; **formal EBNF grammar + canonical test suite**; 15+ independent parser implementations (Rust, TS, Swift, Python, Go, Ruby, .NET, C, etc.), so it is not tied to one maintainer.
- **Cons:** The `@ # ~ {}` syntax is a learning curve for non-technical contributors; metadata model is lighter than YAML-based formats; converting to full schema.org nutrition/rating needs extra fields.
- **Community/longevity:** The most actively developed and broadly adopted of the plain-text recipe formats. Main spec repo ~640 stars, active org (commits through 2025), official iOS/Android apps, Obsidian plugin (~260 stars), CLI, desktop editor, and the canonical `cooklang-rs` parser with bindings. Best ecosystem momentum in this category.

### 3b. RecipeMD
Sources: spec <https://recipemd.org/specification.html> · [GitHub](https://github.com/RecipeMD/RecipeMD)

A convention layered on **standard CommonMark Markdown**, so a RecipeMD file is just a readable Markdown document. Structure (spec v5.0.0):
- `# Title` (level-1 heading)
- description paragraph(s)
- tags = a paragraph that is *only* a comma-separated **italic** list (`*dessert, baking*`)
- yield = a paragraph that is *only* a comma-separated **bold** list (`**8 servings**`)
- `---` horizontal rule
- ingredients = list items (sub-headings create ingredient groups)
- `---`
- instructions = the remaining Markdown

**Example:**
```markdown
# Grandma's Apple Pie

A family apple pie passed down three generations.

*dessert, american, baking*

**8 servings**

---

- 6 *apples*, sliced
- 3/4 cup *sugar*
- 1 tsp *cinnamon*

---

Mix apples with sugar and cinnamon. Bake at 425°F for 1 hour.
```

- **Pros:** It is *just Markdown* — renders fine on GitHub or any viewer with zero tooling, maximally future-proof, easy for semi-technical people. Has a Python reference CLI/library plus a Rust parser and npm package.
- **Cons:** Smaller community than Cooklang; the "italic = tags, bold = yield" convention is implicit and easy to get wrong; no inline ingredient/instruction linkage; nutrition/SEO fields aren't first-class.
- **Community/longevity:** Stable spec (reached v5.0.0), reference implementation maintained, but a niche/single-organization project with a modest ecosystem.

### 3c. Open Recipe Format (.recipe / YAML)
Sources: [GitHub techhat/openrecipeformat](https://github.com/techhat/openrecipeformat) · docs <https://open-recipe-format.readthedocs.io/>

A YAML schema (created by a software engineer with culinary training) aimed at *accurate, flexible structured storage* rather than readable prose. Recipes are YAML documents with keys like `recipe_name`, `recipe_uuid`, `ingredients` (each with `amounts`, `processing`, `notes`, `usda_num`), `steps`, `yield`, `oven_temp`, `notes`, `source_book`, etc.

**Example:**
```yaml
recipe_name: Grandma's Apple Pie
recipe_uuid: 1234-5678
yields:
  - amount: 8
    unit: servings
ingredients:
  - name: apples
    amounts:
      - amount: 6
        unit: each
    processing: [sliced]
steps:
  - step: Mix apples with sugar and cinnamon.
  - step: Bake at 425°F for 1 hour.
```

- **Pros:** Rich, explicit, machine-friendly structure; YAML is human-readable, diff-friendly, and trivially convertible to JSON/schema.org; good for databases and scaling/nutrition math.
- **Cons / status:** **Effectively dormant.** It never reached a large ecosystem, has minimal active maintenance, and exists mostly as a spec with forks (e.g. chauncey-garrett/recipes, adamvoss mirror). The format itself is sound and durable (it is just YAML), but you'd be on your own for tooling. Verbose to hand-author compared to Cooklang/RecipeMD.

### 3d. Markdown + YAML front matter (static-site convention)
Not a single named standard but the *de facto* convention for static-site generators (Jekyll, Hugo, Eleventy, Astro) and tools like Obsidian. Structured metadata lives in a YAML front-matter block; the body is free Markdown.

**Example:**
```markdown
---
title: Grandma's Apple Pie
author: Jane Doe
date: 2026-06-29
cuisine: American
category: Dessert
prep_time: PT30M
cook_time: PT1H
total_time: PT1H30M
yield: 8 servings
tags: [apple, pie, dessert, family]
image: /photos/apple-pie.jpg
ingredients:
  - 6 apples, sliced
  - 3/4 cup sugar
  - 1 tsp cinnamon
---

## Instructions

1. Mix apples with sugar and cinnamon.
2. Bake at 425°F for 1 hour.
```

- **Pros:** The **easiest to author** for non-technical contributors (looks like a normal note); front-matter keys map almost 1:1 onto schema.org so generating JSON-LD is trivial; renders everywhere; enormous, durable tooling ecosystem (every SSG, Obsidian, GitHub) that vastly outlives any recipe-specific project; perfect for git.
- **Cons:** You define your own key names (not a standardized recipe schema), so consistency is on you; ingredient lines are unstructured strings unless you add convention; less "smart" than Cooklang (no auto shopping list) out of the box.
- **Longevity:** Highest of the bunch by virtue of riding general-purpose, ubiquitous tooling rather than a niche recipe project.

---

## 4. Comparison for a long-lived family archive

| Format | Durability (plain-text + survives tooling death) | Portability / convertibility | Ease for non-technical authors | SEO / web sharing |
|---|---|---|---|---|
| **schema.org/Recipe (JSON-LD)** | High (it's just JSON) but verbose | Excellent (the interchange target) | Poor (hand-writing JSON) | **Best** — only path to rich results |
| **h-recipe** | Medium (HTML) | Low today | Poor | Legacy; superseded by JSON-LD |
| **Cooklang** | High (.txt + EBNF spec + many parsers) | Good (parsers export JSON) | Medium (must learn `@#~{}`) | Indirect (convert to JSON-LD) |
| **RecipeMD** | **Very high** (plain CommonMark) | Good (reference parsers) | Good | Indirect |
| **Open Recipe Format** | High (YAML) but tooling dormant | Good (YAML→JSON) | Medium-low (verbose) | Indirect |
| **Markdown + YAML front matter** | **Very high** (ubiquitous tooling) | **Excellent** (front matter → JSON-LD) | **Best** (reads like a note) | Indirect but easy to auto-generate |

Key tension: the format that wins on **web presentation/SEO** (schema.org JSON-LD) is the worst to *author and archive* by hand, while the formats that win on **durability + ease of authoring** (Markdown/YAML, RecipeMD, Cooklang) are not directly consumed by search engines. The resolution is to **separate source of truth from web output**: author in a durable plain-text format, generate schema.org JSON-LD at build time.

---

## 5. Recommendation

For a family collection meant to last **decades** and grow via **emailed contributions from non-technical relatives**, weigh the three axes like this:

1. **Durability** favors plain UTF-8 text in git that needs no special program to read in 30 years. That rules out anything DB-only and discourages relying on a single niche tool.
2. **Ease of authoring** favors something that looks like an ordinary note, because contributions arrive as email prose from people who will never learn `@ingredient{2%cups}`.
3. **Web presentation** is non-negotiably schema.org JSON-LD — but it should be *generated*, never the thing humans edit.

### Primary recommendation: Markdown + YAML front matter as the source of truth, generating schema.org JSON-LD for the website.

- **Source files:** one `.md` per recipe, YAML front matter for metadata (use schema.org-aligned keys — `prepTime`/`cookTime`/`totalTime` as ISO 8601, `recipeYield`, `recipeCategory`, `recipeCuisine`, `keywords`, `image`, `author`), Markdown body for ingredients and steps. Store in a git repo.
- **Why:** maximally durable (plain text on ubiquitous, non-recipe-specific tooling that will outlive any recipe app), the easiest format for relatives to read/edit, diff-friendly for tracking who changed Grandma's pie, and its keys map almost directly to schema.org so a static-site generator (Eleventy/Hugo/Astro/Jekyll) can emit valid Recipe JSON-LD automatically for full Google rich-result SEO.
- **Email-contribution workflow:** relatives email free-form recipes; you (or a small script/LLM step) normalize each into the front-matter template and commit it. The human-facing input stays prose; the structure is added once at intake.

### Strong alternative / complement: Cooklang
If you want **auto-generated shopping lists, scaling, and a real apps ecosystem** and don't mind teaching contributors the syntax (or normalizing for them), Cooklang is the best-maintained, most broadly implemented purpose-built recipe format and is an excellent durable plain-text choice. Its many independent parsers protect you from single-project death. It also converts cleanly to schema.org. Consider it if "smart" features matter more than absolute lowest authoring friction.

### Use, but don't author by hand: schema.org/Recipe (JSON-LD)
Treat it strictly as the **generated web output layer** for SEO, rich results, and interoperability. Never your editing surface.

### Avoid as primaries
- **h-recipe** — legacy, superseded by JSON-LD; small ecosystem.
- **Open Recipe Format** — sound design but effectively unmaintained; you'd own all the tooling.
- **RecipeMD** — a fine, very durable choice and slightly more standardized than ad-hoc front matter; pick it over plain Markdown+YAML only if you value its defined spec more than the larger generic-Markdown tooling ecosystem.

**Bottom line:** Author and archive in **Markdown + YAML front matter** (or **Cooklang** if you want smart features), keep everything in **git**, and **generate schema.org/Recipe JSON-LD** at publish time. This gives you the durability and authoring ease of plain text with the full SEO/sharing power of the dominant web standard — and decouples your decades-long archive from the fate of any single tool.

---

## Sources
- schema.org Recipe type: <https://schema.org/Recipe>
- Google Recipe structured data: <https://developers.google.com/search/docs/appearance/structured-data/recipe>
- Google intro to structured data: <https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data>
- Google Rich Results Test: <https://search.google.com/test/rich-results> · Schema validator: <https://validator.schema.org/>
- Microformats h-recipe: <https://microformats.org/wiki/h-recipe> · hRecipe: <https://microformats.org/wiki/hrecipe> · IndieWeb recipe: <https://indieweb.org/recipe>
- Cooklang: <https://cooklang.org/> · spec: <https://cooklang.org/docs/spec/> · org: <https://github.com/cooklang> · awesome-cooklang: <https://github.com/cooklang/awesome-cooklang>
- RecipeMD: <https://recipemd.org/specification.html> · <https://github.com/RecipeMD/RecipeMD>
- Open Recipe Format: <https://github.com/techhat/openrecipeformat> · <https://open-recipe-format.readthedocs.io/>
