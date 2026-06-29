# Agent intake: adding a recipe

How an AI agent (Claude Code) turns a recipe the maintainer provides — pasted text, a
photo of a card, or forwarded email — into a recipe file. See ADR
[0005](../adr/0005-recipe-intake-via-claude-code.md). Follow the schema in
[`../recipe-schema.md`](../recipe-schema.md) exactly.

## Procedure

1. **Parse the source** into the schema's fields. Read the recipe carefully; don't invent
   quantities or steps. If something is genuinely missing or ambiguous (oven temp, yield,
   a smudged amount), **ask the maintainer** rather than guessing.
2. **Preserve the family voice.** Keep the contributor's wording and any lore ("a pinch
   more nutmeg") — put asides in `notes`, longer stories in the Markdown body. Don't
   sanitize character out of it.
   - **Classify with the controlled vocabulary** in [`../taxonomy.md`](../taxonomy.md):
     pick exactly one `course` **slug** (closed list), reuse an existing `cuisine` and
     existing `tags` before coining new ones, apply dietary tags only if truly accurate,
     and use the person's consistent display name for `contributor`.
3. **Structure the ingredients.** Split each into `qty` / `unit` / `item` / `prep`.
   - Use decimals for `qty` (`0.75`, not `3/4`); the UI renders fractions.
   - Omit `qty`/`unit` for "to taste" or countable items (`3 eggs` → `qty: 3, item: eggs`).
   - Group with `section` when the original has sub-recipes (filling/crust/sauce).

4. **Research the weight (grams) of every measured ingredient** (ADR-0008 — the maintainer
   cooks by weight). For each ingredient, determine the gram weight of **its `qty`** and
   store it in `grams`, with a `gramsSource`, only **when confident**:
   - **Prefer authoritative references** and cite them in `gramsSource`: the King Arthur
     Ingredient Weight Chart, USDA FoodData Central, and reputable density tables. Use
     WebSearch/WebFetch when the value isn't a well-known standard.
   - **Confidence gate (do not guess):**
     - **Store (high confidence):** pantry staples with documented standard weights —
       flours, sugars, butter/fats, salt, leaveners, cocoa, common liquids by volume
       (water/milk ~1 g/ml; honey, oil differ), eggs by count (large ≈ 50 g). Compute
       `grams = standard_per_unit × qty` and set `gramsSource`.
     - **Store as approximate (`gramsApprox: true`):** produce/meat by count or size when a
       credible typical average exists and the description is specific enough
       ("1 medium onion ≈ 110 g", "6 medium apples ≈ 1080 g"). Note the assumption.
     - **Omit:** vague or highly variable items where no credible value applies
       ("1 handful", "to taste", "1 can — size unstated"). Leave `grams` off rather than
       fabricate. If a key ingredient can't be resolved, tell the maintainer.
   - **Sanity-check** every computed weight (order of magnitude; sums make sense for the
     yield). Watch unit traps (fl oz vs oz; US vs metric cup).
   - The site shows a **Weight** toggle when a recipe has enough gram coverage; full,
     trustworthy coverage is the goal of this step.

6. **Structure the steps.** One discrete action per step. Add a `timer` (ISO-8601) to any
   step with a clear duration. Keep temperatures in both °F and °C.
7. **Times** → ISO-8601 (`PT30M`, `PT1H30M`). Compute `totalTime` if not stated.
8. **Write the file** to `recipes/<kebab-title>.md` using the template. Set
   `datePublished` to today if new. Use a unique slug; if a recipe with that name exists,
   confirm whether this is an edit or a distinct variation.
9. **Photos**, if provided:
   - Save under `recipes/images/<slug>/`, reference the filename in `image.src`.
   - Write **meaningful `alt`** text describing the dish.
   - **Strip EXIF/GPS before committing:** `exiftool -all= -overwrite_original_in_place <file>`
     (the site is public — geotags can leak a home address; see ADR
     [0004](../adr/0004-public-site-with-schema-org-json-ld.md)).
   - Don't publish identifiable photos of minors without the maintainer's OK.
10. **Validate.** Once the Astro site exists, run the build so the Zod schema checks the
    file; fix any field errors. Until then, sanity-check against `../recipe-schema.md`.
11. **Report** the new/edited file to the maintainer and let them commit (don't commit or
    push unless asked).

## Editing an existing recipe

Locate `recipes/<slug>.md`, make the change, and bump `dateUpdated`. For a meaningfully
different family take on the same dish, prefer a new recipe (or, later, a Variation)
rather than overwriting — that history is the point of the collection.

## Don't

- Don't hand-write schema.org JSON-LD — it's generated from the fields at build.
- Don't drop the contributor or family notes to make it "cleaner."
- Don't guess quantities, temperatures, or grams you aren't sure of — ask.
