# Agent intake: adding a recipe

How an AI agent (Claude Code) turns a recipe the maintainer provides — pasted text, a
photo of a card, or forwarded email — into a recipe file. See ADR
[0005](../adr/0005-recipe-intake-via-claude-code.md). Follow the schema in
[`../recipe-schema.md`](../recipe-schema.md) exactly.

## Procedure

1. **Parse the source** into the schema's fields. Read the recipe carefully; don't invent
   quantities or steps. If something is genuinely missing or ambiguous (oven temp, yield,
   a smudged amount), **ask the maintainer** rather than guessing.
   - **License consent:** published content is licensed CC BY-NC-SA 4.0 (see the README's
     Licensing section). When the source is material someone sent in (an email, a photo of
     their card), confirm with the maintainer — before the PR merges — that the sender
     wrote the material (or otherwise holds the rights) and agrees to publication under
     that license. The maintainer owns that conversation; just don't let it be skipped
     silently. For third-party sources (a website print-out, a cookbook page), the
     standing rule already applies: use only the uncopyrightable facts (ingredients,
     quantities, steps) and rewrite all prose in our own words — no creative text or
     photos from the source.
   - The source may be a photo, a recipe card, or a **website print-out** — ignore page furniture
     (nav, "printer-friendly", "email this recipe", comment counts, ads, decorative clip-art,
     embedded photos), but capture a printed "Submitted by / From" name as `contributor`.
   - **Apply handwritten annotations** — added lines are new content; **struck-through text is
     deleted (drop it, don't keep struck words)**; distinguish handwriting from print. If an
     annotation's intent or scope is genuinely ambiguous (a bracket's span, what a strikethrough
     targets), apply the clearest reading, note it, and **flag it for the maintainer** rather than
     silently rendering it as clean prose.
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
       flours, sugars, butter/fats, salt, leaveners, cocoa, **ground spices** (cinnamon,
       nutmeg, cloves, allspice, etc. — King Arthur/USDA list them; mark `gramsApprox: true`),
       common liquids by volume (water/milk ~1 g/ml; honey, oil differ), eggs by count
       (large ≈ 50 g). Compute `grams = standard_per_unit × qty` and set `gramsSource`.
     - **Be consistent within a recipe:** weight *all* measured ingredients that have a
       credible standard value, or none — don't weight the cinnamon but skip the nutmeg and
       cloves sitting next to it.
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

5b. **Servings.** `servings` is optional but **normally present** (it drives the scaler). If
   the card omits it, estimate a sensible count and note in your report that it's an estimate —
   a clean number is fine, no in-file disclaimer. **Omit `servings` only for a genuine
   reference/technique page** (e.g. a gravy method sheet) with no fixed yield: give a `yield`
   text, leave unquantified ingredients without `qty`, and keep relative amounts as text.
6. **Structure the steps.** One discrete action per step. Add a `timer` (ISO-8601) to any
   step with a clear duration. Keep temperatures in both °F and °C.
7. **Times** → ISO-8601 (`PT30M`, `PT1H30M`), **only from what the card states**. Never
   invent a `prepTime` or `cookTime` the card doesn't give; compute `totalTime` only when all
   its parts are known, otherwise omit it. Printed durations go in step `timer`s.
8. **Write the file** to `recipes/<kebab-title>.md` using the template. Set
   `datePublished` to today if new. Use a unique slug; if a recipe with that name exists,
   confirm whether this is an edit or a distinct variation.
9. **Photos / hero image.** During the current bulk-import phase, source photos live in the
   **private, gitignored `inbox/`** and are transcription source only — **do not** copy them
   into `recipes/images/`, set the `image` field, or commit them. Heroes stay placeholder, so
   **omit the `image` block** (a dangling `image()` path breaks the build). When a real,
   cleared hero is later supplied:
   - Save under `recipes/images/<slug>/`, and set `image.src` to a path **relative to the
     recipe file**, e.g. `./images/<slug>/hero.jpg`.
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
- Don't drop a named contributor or family notes to make it "cleaner" — but don't *invent* a
  contributor either; omit it when the card has no name (the field is optional).
- Don't guess quantities, temperatures, or grams you aren't sure of — ask.
- **Don't author content that isn't on the card.** No invented ingredients, steps, or
  background trivia; don't migrate a descriptor from a step into an ingredient line. Transcribe
  faithfully and flag genuine gaps instead of filling them.
