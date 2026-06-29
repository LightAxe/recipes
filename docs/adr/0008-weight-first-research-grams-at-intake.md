Status: accepted

# Weight-first: research and store gram weights at intake; offer a weight display/print option

The maintainer cooks by weight (grams) and wants that to be first-class. So intake does
not just transcribe a recipe — it also **researches the gram weight of each measured
ingredient** and, when it can determine the weight **with confidence**, stores it in the
recipe's per-ingredient `grams` field (with a source and an approximate flag). At display
and print time, the user can switch ingredient amounts to **by weight (grams)**, and a
remembered "prefer weight" preference defaults a recipe to the weight view when it has
enough gram coverage. A dedicated **recipe-intake agent** (`.claude/agents/recipe-intake.md`)
encodes this so every ingestion is consistent.

## Why

- It's a primary user preference; weight is also more accurate (esp. baking) and scales
  cleanly. The data model already supported optional `grams`; this makes populating it a
  required, researched intake step rather than an afterthought.

## Consequences

- Intake gains a web-research step (needs WebSearch/WebFetch) and a **confidence gate**:
  store `grams` only when a credible standard value exists; otherwise omit (never guess).
  See `docs/agents/intake.md` and `docs/scaling-and-units.md`.
- Schema gains optional `gramsSource` and `gramsApprox` per ingredient
  (`docs/recipe-schema.md`).
- The Weight toggle + a persisted "prefer weight" preference are v1 UI (already specced in
  `design.md`/`components.md`); print honors the selected unit.
- Display still **defaults to the as-authored units for first-time visitors** (cross-gen
  baseline — many cooks want cups); weight is one prominent tap away and then remembered.
