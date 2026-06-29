# Design System — "Counter"

*Updated 2026-06-29 (supersedes the earlier "Enamelware" exploration — see ADR-0010).
The chosen visual direction, built to be **modular**: every design decision is a token in
one file so it's easy to tweak later.*

## 1. Art direction

**Concept:** a clean, modern **reader** — the recipe is the hero. Big, sharp grotesque
headlines; crisp, highly legible body; generous whitespace; a slim framed hero; numbered
`01 / 02` steps; one confident accent. Calm and premium, not fussy. Ships **light ("Day",
default) and dark ("Night")** from the same tokens.

**Distinct in the universe:** the other axpr sites are dark/atmospheric and concept-heavy
(terminal, investigative, gothic, pixel, diner-zine). Counter is the **bright, structured,
content-first** one — its job is to get out of the way of the food.

**Cross-generational baseline (non-negotiable):** ~19px base type, contrast ≥4.5:1 in both
themes, ~44px+ targets, no hover-only meaning, works without JS, motion gated by
`prefers-reduced-motion`.

## 2. Modularity — the one rule

**All design tokens live in [`src/styles/global.css`](../src/styles/global.css). Components
reference tokens only — never hardcoded colors, fonts, radii, or shadows.** To restyle the
site, edit the tokens; both themes and every component update at once. This is the
"keep it modular so we can tweak later" contract.

The knobs:

| Token group | Tokens |
|---|---|
| Fonts | `--font-display`, `--font-body` |
| Radii | `--radius-xs/-sm/(base)/-lg` |
| Surfaces | `--bg`, `--surface`, `--sunken`, `--line` |
| Text | `--text`, `--muted` |
| Accent | `--accent` (fills), `--accent-ink` (text/links, AA), `--accent-soft` (tints), `--on-accent` |
| Effects | `--shadow-card`, `--focus` |
| Type scale | `--text-h1`, `--text-h2`, `--text-lede`, `--text-eyebrow` |

## 3. Color tokens

### Day (light, default)
| Token | Value | Role |
|---|---|---|
| `--bg` | `#fbfbf9` | page |
| `--surface` | `#ffffff` | cards |
| `--sunken` | `#f1ede6` | wells, image frame, footer |
| `--text` | `#18181b` | primary text |
| `--muted` | `#6b6b70` | secondary — AA on `--bg` |
| `--line` | `#e9e7e2` | hairlines/borders |
| `--accent` | `#e2452f` | step-number fills (+ `--on-accent: #fff`) |
| `--accent-ink` | `#c33a25` | accent **text/links** on `--bg` (≈5.4:1) |
| `--accent-soft` | `#fdeee9` | eyebrow / notes tint |

### Night (dark)
Applied via `[data-theme="dark"]` **and** `@media (prefers-color-scheme: dark)` for no-JS.
| Token | Value |
|---|---|
| `--bg` `#131315` · `--surface` `#1b1b1e` · `--sunken` `#1e1e22` | cool neutral charcoal (no brown) |
| `--text` `#eae8e4` · `--muted` `#9b9aa0` · `--line` `rgba(255,255,255,.09)` | |
| `--accent` `#ff6a4d` · `--accent-ink` `#ff8268` · `--on-accent` `#15110e` | brightened for dark |

## 4. Typography
- **Display — `Archivo Variable`** (self-hosted via `@fontsource-variable/archivo`):
  sturdy, structured grotesque. Wordmark, headings, eyebrows, step numbers, nav. Weights
  700–800, tight `-0.01em` to `-0.02em` tracking.
- **Body/UI — `Public Sans Variable`** (`@fontsource-variable/public-sans`): crisp,
  neutral, highly legible. Body, ingredients, steps, meta.
- Base **19px** fluid (`clamp(18px, 1rem + 0.25vw, 20px)`), body line-height 1.6.

## 5. Shape, depth, motion
- **Tight radii** (`0.3–0.9rem`) — structured, not pill-soft.
- **Soft depth:** one diffused `--shadow-card`; hairline `--line` borders; no harsh
  shadows or heavy borders.
- **Restrained motion:** custom `cubic-bezier(0.32, 0.72, 0, 1)`; card/wordmark hover
  lifts; sticky translucent header (`backdrop-blur`); always gated by reduced-motion.

## 6. Component treatments
- **Header:** sticky, translucent (`color-mix` bg + blur), hairline bottom; wordmark +
  live-routes-only nav + theme toggle.
- **Wordmark:** "**Ogilvie** Family Recipes" — Archivo 800 + muted weight, accent on hover.
- **RecipeCard:** surface + hairline + `--shadow-card`, 16:10 thumb, course eyebrow, title,
  muted meta; image-optional with an "Ogilvie" fallback.
- **Recipe page:** eyebrow (course) · big Archivo title · meta row (contributor in accent,
  times, serves) · lede · slim **16:7 framed hero** (`<Picture>` AVIF/WebP) · two-column
  with a **sticky ingredient card** (grams shown muted, `≈` for approximate) · `01/02`
  accent step badges · accent-soft **Notes** block · "Read the story" `<details>`.
- **ThemeToggle:** sun/moon, hidden without JS (system theme applies via CSS).
- **Footer:** hairline top, muted, the **"Part of the [axpr] cinematic universe"** line
  with `axpr` in accent.

## 7. Print & later phases
Print stylesheet + 4×6 card, the interactive layer (scaler, unit/weight toggle,
tap-to-check, cook mode, timers), JSON-LD, and richer browse are Phase 2–3 — all will draw
from these same tokens.

## 8. Notes
- Theme resolution: saved choice → `prefers-color-scheme` → Day; a pre-paint inline script
  prevents flash; toggle persists to `localStorage`.
- Fonts are self-hosted (no third-party requests), matching the sibling sites' convention.
- Likely future tweaks (the reason for the token discipline): the **accent** color, exact
  charcoal/paper values, and possibly the display face — all single-place edits.
