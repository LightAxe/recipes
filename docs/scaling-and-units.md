# Scaling & Unit Conversion Spec

*Drafted 2026-06-29. The correctness-critical pure logic behind the serving scaler and
unit toggles. Operates on the structured ingredient fields from `recipe-schema.md`
(`qty`, `unit`, `item`, `grams`). Implemented as pure, unit-tested functions in
`src/lib/` (`scaling.ts`, `units.ts`); the UI (`src/scripts/`) only reads/writes the DOM.
Get this right once and the interactive features are trustworthy.*

## 1. Scope & principles

- **Two independent controls:** (a) **serving scaler** — a multiplier; (b) **unit
  display** — two orthogonal toggles: **system** (US ⇄ Metric) and **measure** (Volume ⇄
  Weight).
- **Weight is a first-class option** (ADR-0008). Grams are researched and stored at intake
  (`docs/agents/intake.md`). A persisted **"prefer weight"** preference (per visitor,
  `localStorage`) defaults a recipe to the Weight view **when it has enough gram coverage**.
  First-time visitors still default to the **as-authored** units (cross-gen baseline — many
  cooks want cups), with Weight one prominent tap away and then remembered.
- **Source of truth never changes.** Frontmatter holds the *as-authored* amounts; scaling
  and conversion are display transforms. **JSON-LD always emits the base, as-authored
  values** (stable for search/scrapers); only the on-screen DOM reflects the user's
  choices. Print reflects the current on-screen state.
- **Honest, not clever.** Linear scaling is approximate for some ingredients; we show a
  gentle caveat rather than silently "fixing" things.
- **Deterministic & test-first.** No floating-point drift in displayed values — round at
  the display boundary with explicit rules (§5).

## 2. Serving scaler

```
factor = targetServings / baseServings        // baseServings = frontmatter `servings`
```

- **Presets** `1× 2× 3×` plus an **editable serving count** (→ arbitrary factor).
  `0.5×` allowed (halving). Factor clamped to a sane range (e.g. 0.25–12).
- **Scales:** `qty` and `grams` (both linear, `× factor`).
- **Never scales:** `prep` text, `item`, step text. (A "timer" duration does **not**
  auto-scale — bake time isn't linear; see caveats.)
- **No-quantity ingredients** ("to taste", "a pinch", items with no `qty`) are shown
  unchanged.
- State persists (URL param `?x=2` and/or `localStorage`), so refresh/print keep the scale.

### Caveats surfaced to the user (not auto-applied)
A small, dismissible note when `factor ≠ 1`:
> *Scaled amounts are a starting point. Salt, spices, leavening, eggs, and bake times
> don't scale exactly — taste and watch as you go.*

Discrete/awkward results (e.g. "1.5 eggs") are rendered honestly (see §5) rather than
hidden.

## 3. Unit model

| Measure | System | Units (smallest→largest) |
|---|---|---|
| Volume | US | tsp, tbsp, fl oz, cup, pint, quart, gallon |
| Volume | Metric | ml, l |
| Weight | US | oz, lb |
| Weight | Metric | g, kg |
| Count | — | (unitless: eggs, apples) — scaled by count; **shown by weight in Weight view if `grams` is present** (e.g. produce with a researched approx weight), otherwise count only |

"pinch"/"dash"/"to taste" are **non-numeric** → pass through untouched.

## 4. Conversion constants (exact-ish; round only at display)

**Volume (to ml):** tsp 4.92892 · tbsp 14.7868 (=3 tsp) · fl oz 29.5735 · cup 236.588
(=16 tbsp) · pint 473.176 · quart 946.353 · gallon 3785.41.
**Weight:** oz 28.3495 g · lb 453.592 g (=16 oz).

### Volume ⇄ Weight needs density — which we don't store
We do **not** store density; we store **`grams`** (the weight of the *as-authored* qty)
per ingredient when known (`recipe-schema.md`). Therefore:

- **Weight view uses `grams`** (× factor), converted to oz/lb (US) or g/kg (Metric).
- If an ingredient has **no `grams`**, it has no reliable weight → in Weight view it
  **falls back to its volume measure** (and is flagged subtly, e.g. a "≈" or muted state).
- **Per-recipe toggle gating:** show the **Weight** toggle only when it's useful — i.e.
  when the substantive measured ingredients have `grams`. If few do, hide Weight for that
  recipe (Volume + system toggle still work). This is why intake adds `grams` for baking.

Going **US volume → Metric volume** (e.g. cups → ml) is pure math (no density) and always
available.

## 5. Rounding & fraction rendering (the fiddly part)

Round **only the final displayed number**, by unit class:

- **US volume (cups/tbsp/tsp):** snap to common kitchen fractions and render with vulgar
  glyphs. Allowed set: `⅛ ¼ ⅓ ⅜ ½ ⅝ ⅔ ¾ ⅞` (+ whole numbers). Snap granularity: `tsp`/
  `tbsp` → nearest ⅛; `cup` → nearest ¼ (⅓/⅔ permitted since cups commonly use thirds).
  Combine whole + fraction ("1½ cups"). Example: `0.75 cup → ¾ cup`; `1.5 cup → 1½ cups`.
- **Metric volume (ml/l):** ml → nearest 1 below 25, nearest 5 at/above 25; promote to `l`
  with one decimal at ≥1000 ml ("1.2 l"). Example: `1.5 cup → 355 ml`.
- **Weight grams:** g → nearest 1 below 25, nearest 5 at/above 25; promote to `kg` (2 dp)
  at ≥1000 g. Example: `150 g → 150 g`; `1500 g → 1.5 kg`.
- **US weight (oz/lb):** oz to nearest ¼ below 16 oz; promote to `lb` (+ remaining oz, or
  decimal lb) at ≥16 oz. Example: `900 g → 2 lb` (≈31.7 oz → "2 lb").
- **Counts (unitless):** halvable items round to nearest ½; non-halvable to nearest whole.
  For an awkward count like 1.5 eggs, render honestly: **"1½ eggs"** with an optional hint
  *("use 1 egg + 1 yolk, or beat 2 and use half")*. Never silently round eggs to 2.

**Unit normalization (readability):** before rounding, promote to the most readable unit
within the chosen system/measure using thresholds — e.g. `3 tsp → 1 tbsp`, `4 tbsp →
¼ cup`, `16 tbsp → 1 cup`, `1000 ml → 1 l`, `1000 g → 1 kg`, `16 oz → 1 lb`. Pick the
largest unit that yields a value `≥ 1` (with the fraction rules), so we show "1½ cups"
not "24 tbsp".

**Precision:** carry full precision through the math; apply the rules above exactly once at
render. Prefer integer/rational arithmetic (e.g. work in ml and grams internally) to avoid
binary-float artifacts like `0.1 + 0.2`.

## 6. Display matrix

For each ingredient, given (system, measure):

| (system, measure) | Has `unit` (volume) + `grams` | Has `unit` only | Count + `grams` | Count, no `grams` |
|---|---|---|---|---|
| US, Volume | US volume (normalized) | US volume | count | count |
| Metric, Volume | metric volume (from ml) | metric volume | count | count |
| US, Weight | oz/lb (from grams) | **fallback → US volume (≈)** | oz/lb (from grams) | count |
| Metric, Weight | g/kg (from grams) | **fallback → metric volume (≈)** | g/kg (from grams) | count |

A count item shows by **weight** in Weight view when it has `grams` (produce researched at
intake), otherwise stays a count. `gramsApprox: true` renders with "≈". Non-numeric
amounts ("to taste") always pass through.

## 7. Data flow & DOM contract

- Server-render each ingredient with data attributes carrying the **base** values:
  `data-qty`, `data-unit`, `data-grams`, `data-count` (bool). Visible text = as-authored.
- `scaling.ts` computes scaled base values; `units.ts` formats to the chosen
  (system, measure) using §5–§6. The script rewrites only the number/unit span.
- **No-JS:** the as-authored, base-serving amounts are already in the HTML — fully usable.
- **JSON-LD** is generated at build from base values and is **independent** of UI state.
- **Print** serializes the current DOM (so a printed copy matches what you scaled to);
  the 4×6 card view does the same.

## 8. Edge cases

- **Ranges** ("2–3 apples"): **deferred for v1** — `qty` is a single number (see
  `recipe-schema.md`), so express a range in `note`/`prep` text for now. When range-typed
  `qty` is added later, scale both ends and keep the en-dash.
- **Fraction in source** (`qty: 0.33`): treat `0.33`/`0.66` as ⅓/⅔ on render.
- **Zero/again-no qty:** render item alone (e.g. "Salt, to taste").
- **Mixed grams coverage:** Weight view shows grams-backed items by weight and flags the
  volume-fallback ones; gating (§4) avoids offering Weight when it'd be mostly fallback.
- **Sectioned ingredients:** scaling/conversion is per-item, independent of `section`.
- **Tiny amounts** ("⅛ tsp" × 0.5): floor at the smallest sensible unit ("a pinch") rather
  than rendering "1/16 tsp".

## 9. Worked example — Grandma's Apple Pie (base 8 servings)

| Ingredient | base | ×2 (US vol) | ×2 (Metric vol) | ×2 (Metric weight) |
|---|---|---|---|---|
| apples (count, ≈1080 g) | 6 | 12 | 12 | ≈ 2.16 kg |
| sugar | ¾ cup / 150 g | 1½ cups | 355 ml | 300 g |
| flour | 2 tbsp / 16 g | ¼ cup | 59 ml | 32 g |
| cinnamon | 1 tsp / 3 g | 2 tsp | 10 ml | 6 g |
| nutmeg | ¼ tsp | ½ tsp | 2 ml | *(no grams → 2 ml ≈)* |

## 10. Implementation & testing notes

- Pure modules `src/lib/units.ts` (constants, normalize, format, fractions) and
  `src/lib/scaling.ts` (factor, scale) — **no DOM imports**, fully unit-tested.
- **Test cases to cover:** fraction snapping table; unit promotion thresholds; g↔oz/lb and
  cup↔ml round-trips within tolerance; egg/half-count rendering; grams-absent fallback;
  metric promotion to l/kg; tiny-amount flooring; factor clamping; idempotence at ×1.
- Keep the conversion constants and rounding rules in **one place** so the spec, the code,
  and `/tips/conversions/` (the public chart) never diverge.

## 11. Decisions & open questions

**Resolved (2026-06-29):**
- **Default unit state** — remember the visitor's last choice globally (`localStorage`),
  including the **"prefer weight"** preference (ADR-0008). First-time visitors see
  as-authored units; weight is one prominent tap away and then sticks.
- **Fractions only** for US volume (no decimal toggle) — simpler, matches cookbooks.
- **Bake times don't auto-adjust** on scaling — too unreliable; the caveat note covers it.
