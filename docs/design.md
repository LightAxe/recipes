# Design System — "Enamelware"

*Drafted 2026-06-29 using the Databricks `frontend-design` skill (`.claude/skills/`).
The chosen visual direction for the family recipe site (ADR-0007). Living document — we
iterate here before building. Implementation-ready: tokens map directly to a Tailwind v4
`@theme` block + CSS custom properties.*

## 1. Art direction

**Concept:** a mid-century domestic kitchen rendered in **vintage enameled cookware** —
Dansk Kobenstyle, Le Creuset, and especially **Cathrineholm "Lotus"** enamelware. Glossy
cream surfaces with a dark steel rim, confident blocks of teal/tomato/butter, tiled
backsplashes, and a recipe tin on the counter. Warm, nostalgic, *fresh* — not twee.

**The one unforgettable thing:** recipe cards that read as **little enamel dishes** — a
chunky dark "steel rim," a soft glossy top highlight, and the **petal/lotus motif** used
as bullets, dividers, and section tabs. Paired with **hand-drawn ingredient spots** and a
**checkerboard-tile** backsplash.

**Tone:** playful/refined hybrid. Joyful and tactile, executed with precision and
restraint so it stays elegant and—critically—**maximally legible for all ages**.

**Why it's distinct in the universe:** axpr.net = terminal green/dark; goatmeal =
investigative sepia; zombietrailers = gothic rust; subterrans = retro pixel; pollicio.us =
diner-zine warm paper. Enamelware is the only **bright, saturated, illustrative,
object-inspired** one — and the only one leading with a legibility-first typeface.

**Both themes ship at v1.** "Counter" (light) is the **default and canonical** experience
(cross-gen legibility + the enamel joy read best bright); "Night Kitchen" (dark) is a
first-class alternative. Theme resolution order: a user's saved choice → their system
`prefers-color-scheme` → light. A small **theme toggle** lives in the nav (see §7); the
choice persists in `localStorage` and is applied by a tiny inline `<head>` script *before
paint* to avoid a flash of the wrong theme.

## 2. Color tokens

Warm cream base, ink text, three enamel accents (teal / tomato / butter), steel for rims.
Contrast ratios noted for every text pairing (target **WCAG AA**, AAA where free).

### Light theme — "Counter"

| Token | Hex | Role |
|---|---|---|
| `--cream` | `#F7EFE0` | page background |
| `--cream-raised` | `#FCF7EC` | raised surface (cards) |
| `--sand` | `#EFE3CD` | sunken/section background, tile base |
| `--ink` | `#2A2622` | primary text — **13:1 on cream (AAA)** |
| `--ink-soft` | `#5A5048` | secondary text — **6.5:1 on cream (AA)** |
| `--steel` | `#211C18` | enamel rim / borders / heavy detail |
| `--teal` | `#1E8E8E` | decorative teal surfaces/fills (non-text) |
| `--teal-strong` | `#0F7A7A` | teal fill **with white text — 4.8:1** |
| `--teal-ink` | `#0B5C5C` | teal **text/links on cream — 6.0:1 (AA)** |
| `--tomato` | `#D8412F` | decorative tomato (non-text) |
| `--tomato-strong` | `#C0291A` | primary action fill **+ white text — 5.8:1** |
| `--tomato-ink` | `#B5301C` | tomato **text/links on cream — ~6:1 (AA)** |
| `--butter` | `#F2C14E` | highlight surface **+ ink text — 9:1**; "checked" wash |
| `--butter-soft` | `#F7D585` | soft highlight, hover/active wash |
| `--white` | `#FFFFFF` | glossy highlights, text on strong fills |

**Rule:** `--teal`/`--tomato`/`--butter` (bright) are for **fills, shapes, and large
decoration only**. For text or icons that must be read, use `--teal-ink` / `--tomato-ink`
/ `--ink`. White text only on `--*-strong` fills.

### Dark theme — "Night Kitchen"

| Token | Hex | Role |
|---|---|---|
| `--bg` | `#1A1815` | warm charcoal page bg |
| `--surface` | `#232019` | raised surface |
| `--sand` | `#2C2820` | sunken/section |
| `--ink` (text) | `#F2E8D6` | primary text — high contrast on bg |
| `--ink-soft` | `#C3B6A0` | secondary text |
| `--steel` | `#0E0C0A` | rim/border (darker than surface) |
| `--teal` | `#38B9AC` / text `#5BD0C2` | accent / teal text |
| `--tomato` | `#F2715B` / link `#F58A77` | accent / link |
| `--butter` | `#F2C14E` | highlight (ink text) |

### Semantic mapping (what components reference)

```
--color-bg, --color-surface, --color-sunken
--color-text, --color-text-muted
--color-border           → steel
--color-brand            → teal      (identity)
--color-action           → tomato-strong (primary buttons: Cook Mode, Print)
--color-accent           → butter    (highlights, checked state)
--color-link             → teal-ink (light) / tomato link (dark)
--color-focus            → tomato-strong (focus ring)
```

## 3. Typography

Three faces, all **self-hosted via `@fontsource`** (no third-party requests; privacy +
perf; universe convention).

- **Display — `Fredoka`** (rounded geometric sans, weights 400–600). Friendly,
  mid-century, instantly legible to kids and elders alike. Used for the wordmark,
  headlines, recipe titles, step numbers. Use Medium/SemiBold — never the bubbliest weight.
- **Body & UI — `Atkinson Hyperlegible`.** Designed by the Braille Institute for low
  vision: disambiguated letterforms, generous apertures. This is the legibility backbone
  for our 8-to-80 audience and a *meaningful* (not generic) choice.
- **Mono accent — `DM Mono`.** Small caps metadata: times, yields, "RECIPE No. 011",
  ingredient quantities (tabular alignment). A warm, rounded mono distinct from the
  siblings' IBM Plex / JetBrains / Special Elite.

### Scale (root font-size fluid 18–20px; canonical **19px**)

```
:root { font-size: clamp(18px, 1rem + 0.25vw, 20px); }   /* 1rem ≈ 19px */
```

| Step | Size (rem / ~px @19) | Use | Face / line-height |
|---|---|---|---|
| meta | 0.82 / 15.5 | mono labels, captions | DM Mono / 1.4 |
| sm | 0.9 / 17 | fine print, footnotes | Atkinson / 1.5 |
| **base** | **1.0 / 19** | **body, ingredients, steps** | Atkinson / 1.6 |
| lead | 1.18 / 22 | headnote, **cook-mode step** | Atkinson / 1.55 |
| h3 | 1.4 / 27 | sub-sections | Fredoka 500 / 1.2 |
| h2 | 1.8 / 34 | section titles | Fredoka 500 / 1.15 |
| h1 | 2.4 / 46 | recipe title | Fredoka 600 / 1.1 |
| display | clamp(2.6, 6vw, 3.6rem) | hero/wordmark | Fredoka 600 / 1.05 |

Body never below **base (19px)**; cook-mode step text is **lead (22px)** minimum.

## 4. Spacing, radii, borders, shadows

```
/* spacing scale (rem) */ 0.25 0.5 0.75 1 1.5 2 3 4 6
/* radii — enamelware is generously rounded */
--radius-sm: 8px;  --radius: 14px;  --radius-lg: 22px;  --radius-pill: 999px;
/* the enamel rim */
--rim: 3px solid var(--color-border);          /* steel */
/* glossy top highlight (inset) + soft drop */
--shadow-enamel: inset 0 2px 0 rgba(255,255,255,.55), 0 8px 20px rgba(33,28,24,.12);
/* tactile "tin" press shadow for buttons (hard offset) */
--shadow-tin: 3px 3px 0 var(--color-border);
```

- **Cards / dishes:** `--cream-raised` fill, `--rim`, `--radius-lg`, `--shadow-enamel`.
- **Buttons (primary):** `--color-action` fill, white text, `--radius-pill`,
  `--shadow-tin`; on `:active` translate `(2px,2px)` and collapse the shadow (presses like
  an enamel tin). Min height **48px**, min width 48px for icon buttons.
- Generous negative space; controlled density inside cards.

## 5. Motifs & illustration

1. **Petal / Lotus** (Cathrineholm-derived) — the signature shape. An SVG teardrop-petal,
   used as: list **bullets**, **section dividers** (a row of alternating teal/tomato
   petals), the **empty/loading** state, and the favicon/wordmark mark. Single recurring
   geometry across the site.
2. **Checkerboard tile** — a subtle two-tone (`--sand` / `--cream`) backsplash behind
   heroes, the footer, and section breaks. Low contrast so it never fights text. Also a
   **checker strip** framing the top edge of hero images (the "▦▦" in the mockup).
3. **Ingredient spot illustrations** — hand-drawn style spec so all future art matches:
   - 2px rounded ink stroke (`--ink`) + **one** flat accent fill (teal/tomato/butter).
   - Loose, friendly, slightly imperfect; transparent background; ~64–96px.
   - Used beside ingredient-group headers and as category icons. Ship a small starter set
     (flour, egg, apple, butter, pot, whisk, lemon, jar); reuse + grow.
4. **Enamel chip** — optional tiny corner detail on a card revealing "steel," as a rare
   delight, never on interactive edges.

All motifs are **decorative** → `aria-hidden`, never the sole carrier of meaning.

## 6. Motion

CSS-only; **always gated by `@media (prefers-reduced-motion: reduce)`** (then: no
transforms, instant states).

- **Page load:** recipe card sections fade+rise 8px, **70ms stagger** (hero → meta →
  ingredients → method). One orchestrated reveal beats scattered fidgets.
- **Button press:** the "tin tap" (translate + shadow collapse), 90ms.
- **Tap-to-check:** ingredient gets a `--butter-soft` wash + a teal check that **blooms**
  from a petal (scale 0→1, 160ms), text strikes through.
- **Timer:** gentle 2s pulse on the active chip.
- **Cook mode:** smooth 220ms layout transition to the focused view.

## 7. Component treatments

### Recipe card ("the dish")
Cream-raised, steel rim, glossy highlight, `--radius-lg`. Hero image with a checker strip
across its top edge. Title in Fredoka 600. Meta row in DM Mono with **petal separators**:
`PREP 30m · COOK 1h · SERVES 8`. Primary **Cook Mode** pill (tomato/white). Scaler +
unit toggles sit in a butter-tinted control strip.

### Ingredient list
Each row: **petal bullet** (teal) · qty in DM Mono (tabular-nums, so columns align) ·
item in Atkinson. Whole row is a **48px tap target** that toggles checked (butter wash +
teal petal-check + strikethrough). Group headers render as little **tile tabs** (sand
fill, rounded top) with the ingredient spot illustration.

### Step list
Steps numbered in **enamel-circle badges** (teal-strong fill, cream numeral, Fredoka).
Generous spacing, lead-size text. A step with a `timer` shows a **tomato-outline chip**
("⏱ 1h") that starts an in-page countdown. Each step is independently tap-to-check.

### Scaler & unit toggles
Segmented **pills**. Scaler `[1× 2× 3×]` + editable serving number; active segment =
tomato-strong/white. Unit toggles `US ⇄ Metric` and `Volume ⇄ Weight` (weight uses
per-ingredient researched grams — ADR-0008). The **Weight** toggle is prominent and, with
a remembered **"prefer weight"** preference, defaults a well-covered recipe to grams. All
≥48px, keyboard-operable, `aria-pressed`. (Logic: `scaling-and-units.md`.)

### Cook mode
A sticky **CookModeBar** toggles a focused layout: one large step at a time (lead+ size),
dimmed chrome, big prev/next, the wake-lock engaged (re-acquire on `visibilitychange`,
release on exit; small "screen stays on" note). Exit is always one obvious tap. The
checker backsplash dims to keep focus on the step.

### Print + 4×6 card (`@media print`)
Strip nav/footer/share/cook-mode/scaler UI. Switch to ink-on-white; body stays Atkinson,
titles Fredoka, a single **petal divider** between ingredients and method.
`break-inside: avoid` on steps/ingredient groups. Two outputs:
- **Standard:** `@page { margin: 1.4cm }`, ingredients + method, optional hero.
- **4×6 card:** `@page { size: 4in 6in; margin: .3in }` compact view, no photo, the
  petal mark in the corner like a printed recipe card. A "Print" button offers both.

### Nav & wordmark
Simple, big targets. Wordmark = **petal mark + "Ogilvie Family Recipes"** in Fredoka. A visible, open
search field (not behind an icon) and plain-language category links — both search and
browse, per the cross-gen research.

### Theme toggle
A nav control (≥48px, `aria-pressed`/labelled) switching Counter ⇄ Night Kitchen, shown
as a little enamel **sun/pot** ⇄ **moon** petal glyph. Persists to `localStorage`; the
pre-paint inline script (see §2/top) sets `data-theme` so there's no flash. Honors
`prefers-color-scheme` until the user chooses explicitly. Has clear focus + active states.

### Footer — universe line, enamelware-styled
A **checkerboard enamel strip**. Left: `© 2026 [Family]`. Right, in DM Mono small caps:

```html
<p class="universe">
  Part of the <a href="https://axpr.net">axpr</a> cinematic universe
</p>
```

`axpr` is set in `--tomato-ink` (light) / tomato link (dark) with a petal glyph before it;
focus + hover both underline. Same words as every sibling, dressed as enamelware.

## 8. Accessibility baseline (non-negotiable)

- Base text **19px**, scalable to 200% (rem/em everywhere).
- Contrast: every text token pairing **≥4.5:1** (documented in §2); decorative-only colors
  never carry text.
- Tap targets **≥48px**; focus ring = 3px `--color-focus` at 2px offset, on **every**
  interactive element.
- **No hover-only** behavior — all hover states have focus + active equivalents; cook
  mode, timers, checks, scaler are real buttons.
- Motion gated by `prefers-reduced-motion`; motifs `aria-hidden`; images get meaningful
  alt (per intake doc).
- Works fully **without JavaScript** (progressive enhancement, per architecture §2).

## 9. Token implementation sketch (Tailwind v4)

```css
@import "tailwindcss";
@theme {
  --color-cream: #F7EFE0;  --color-cream-raised: #FCF7EC;  --color-sand: #EFE3CD;
  --color-ink: #2A2622;    --color-ink-soft: #5A5048;      --color-steel: #211C18;
  --color-teal: #1E8E8E;   --color-teal-strong: #0F7A7A;   --color-teal-ink: #0B5C5C;
  --color-tomato: #D8412F; --color-tomato-strong: #C0291A; --color-tomato-ink: #B5301C;
  --color-butter: #F2C14E; --color-butter-soft: #F7D585;
  --font-display: "Fredoka", system-ui, sans-serif;
  --font-body: "Atkinson Hyperlegible", system-ui, sans-serif;
  --font-mono: "DM Mono", ui-monospace, monospace;
  --radius-lg: 22px;  --radius-pill: 999px;
}
/* semantic + dark theme via [data-theme="dark"] overrides of the --color-* set */
```

## 10. Decisions & open questions

**Resolved (2026-06-29):**
- **Themes:** both **Counter (light, default)** and **Night Kitchen (dark)** ship at v1,
  with a nav toggle (§7).
- **Illustration scope — minimal for v1:** the petal/lotus motif, checkerboard tiles, and
  a **small starter set of ingredient spots** only — `flour, egg, apple, butter, pot,
  whisk, lemon, jar` — reused across recipes. A richer per-category illustration set is a
  later phase.
- **Wordmark:** **surname-based** masthead (working: "Ogilvie Family Recipes").

- **Wordmark wording — confirmed: "Ogilvie Family Recipes."**

**Still open:**
- **Petal mark** — confirm the lotus-petal as the logo, or explore an enamel-pot mark.
- **When to build visuals** — Rob chose to keep refining docs for now; once we're happy, a
  static HTML mockup of one recipe page (apple-pie) is the next artifact before wiring Astro.
