Status: accepted (supersedes the "Enamelware" direction referenced in ADR-0007)

# Adopt the "Counter" design system (modular, token-driven)

After building and reviewing several full-page mockups, the maintainer chose **"Counter"**
— a clean, content-first reader (sharp Archivo + Public Sans, neutral light/dark palette,
one warm accent, slim framed hero, `01/02` steps) — over the earlier "Enamelware"
exploration, which read too playful. The system is implemented **token-driven**: every
color, font, radius, and shadow is a CSS custom property in `src/styles/global.css`, and
components reference tokens only — so the look can be tweaked later from one place. Both
light ("Day", default) and dark ("Night") ship from the same tokens. Full system in
`docs/design.md`.

## Why

- "Enamelware" was the wrong feel for the maintainer; Counter fits and is the bright,
  structured, recipe-first counterpoint to the (dark/atmospheric) sibling sites.
- The maintainer expects to keep tweaking the design, so **modularity is a requirement**,
  not a nicety — hence the strict tokens-only discipline.

## Consequences

- The Phase 1 components/pages were restyled to Counter; fonts swapped to self-hosted
  Archivo + Public Sans (the Enamelware fonts/motifs were removed).
- ADR-0007's "distinct aesthetic" still holds — the aesthetic is now Counter, not Enamelware.
- Future restyles should stay tokens-only; avoid hardcoded design values in components.
