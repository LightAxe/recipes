# AGENTS.md

> Single source of truth for humans and AI agents working in this repo.
> Cross-platform by design — `CLAUDE.md` and any other tool-specific files point here.

## What we're building

A **family recipe collection website**. We have an old family recipe book plus
decades of additions from family members. None of it is stored electronically, and
sharing with new/younger family members is hard. This project digitizes the existing
recipes and makes them easy to browse, cook from, print, and grow over time.

**This is a family archive, not a social network.** No feeds, likes, follows, or
algorithmic anything. The goal is a calm, durable, beautiful home for our recipes
that family members of every age can use.

## Core goals

1. **Capture** all existing paper recipes as durable, structured data.
2. **Present** them in a way that works for everyone — boomers through Gen Alpha —
   on **mobile, desktop, and in print**.
3. **Grow** the collection over time. Family members contribute by **emailing a
   recipe** to the maintainer, who adds it to the site.
4. **Preserve the family character** — handwritten notes, attributions, the
   "Grandma always added a pinch more" lore — without burying the actual recipe.
5. **Last for decades.** Favor durable, portable, plain-text-friendly formats and
   low-maintenance, low-cost hosting over trendy platforms.

## Hard requirements

- Mobile-friendly **and** desktop-friendly (responsive).
- A clean **printable** version of each recipe.
- Support for **photos** (finished dish, and ideally step photos).
- Easy for a **non-technical maintainer** to add recipes from emailed submissions.
- Accessible across generations: large readable type, high contrast, big tap
  targets, simple navigation, no hover-only interactions.
- Space for **cooking tips / technique / reference content** alongside recipes.

## Non-goals (for now)

- User accounts, comments, ratings, social features.
- A public free-for-all submission form (intake is curated via email → maintainer).
- Mobile apps. (A good responsive website is the target.)

## Stack & data format

> **Decided.** Research is in `research/` (start with
> [`research/00-summary.md`](./research/00-summary.md)); each choice is recorded as an
> ADR in `docs/adr/`. Summary:

- **Recipe data format:** Markdown + YAML frontmatter, structured & schema.org-aligned;
  schema.org/Recipe JSON-LD generated at build. ADR [0002]. Spec: [`docs/recipe-schema.md`](./docs/recipe-schema.md).
- **Site framework:** **Astro 6 (~6.1.x) + Tailwind CSS 4 + TypeScript + Node ≥22**, static
  site, content collections + Zod. ADR [0003], [0007]. Tailwind is wired via **PostCSS**
  (`@tailwindcss/postcss`), not the Vite plugin — ADR [0009]. Matches the Astro siblings.
- **Hosting:** **AWS S3 + CloudFront** (GitHub Actions OIDC) + Route 53 + Cloudflare
  Analytics — like the rest of the universe. ADR [0006].
- **Visibility:** public-by-design with schema.org JSON-LD/RSS/sitemap (ADR [0004]). Domain
  **recipes.axpr.net**; **staged behind a `SITE_LIVE` gate** (noindex until go-live, ADR [0011]).
- **Photo handling:** optimized at build with sharp (`astro:assets`), committed in-repo;
  **EXIF stripped from the committed source** before commit (public repo — see the EXIF step
  under _Working agreements for agents_; `sips` resizing does **not** strip it).
- **Intake:** maintainer provides recipes to **Claude Code**, which writes the files.
  ADR [0005]. Procedure: [`docs/agents/intake.md`](./docs/agents/intake.md). A dedicated
  **`recipe-intake` agent** ([`.claude/agents/recipe-intake.md`](./.claude/agents/recipe-intake.md))
  automates it and **researches/stores ingredient weights in grams** (ADR [0008]).
- **Cook by weight:** grams are researched at intake (with confidence) and a Weight
  display/print option + "prefer weight" preference. ADR [0008]. Logic:
  [`docs/scaling-and-units.md`](./docs/scaling-and-units.md).
- **Universe:** signature footer + hub-registry entry (tag `family`); own distinct
  aesthetic. ADR [0007].
- **Visual design:** **"Counter"** (clean modern reader; modular token system, light+dark).
  System: [`docs/design.md`](./docs/design.md). ADR [0010].
- **Architecture:** progressive-enhancement static site. Review: [`docs/architecture.md`](./docs/architecture.md).

[0002]: ./docs/adr/0002-recipes-as-markdown-with-yaml-frontmatter.md
[0003]: ./docs/adr/0003-astro-static-site-on-cloudflare-pages.md
[0004]: ./docs/adr/0004-public-site-with-schema-org-json-ld.md
[0005]: ./docs/adr/0005-recipe-intake-via-claude-code.md
[0006]: ./docs/adr/0006-deploy-to-s3-cloudfront-to-match-the-universe.md
[0007]: ./docs/adr/0007-join-the-axpr-cinematic-universe.md
[0008]: ./docs/adr/0008-weight-first-research-grams-at-intake.md
[0009]: ./docs/adr/0009-tailwind-v4-via-postcss.md
[0010]: ./docs/adr/0010-counter-design-system.md
[0011]: ./docs/adr/0011-staged-launch-via-site-live-gate.md
[0012]: ./docs/adr/0012-no-in-page-timers.md

## v1 scope

- **Interactive recipe pages:** lightweight cook mode (screen-wake-lock), serving scaler,
  US/metric + volume/weight toggle, tap-to-check ingredients & steps — plus responsive
  layout, accessibility baseline, and a print view (clean / with-photo / 4×6 card). **No
  in-page timers** (ADR-0012). See `research/03-cross-generational-ux.md` for the checklist.
- **Attribution & notes:** basic `contributor` attribution plus free-form `notes` — family
  lore and commentary live in a recipe's `notes`. Scanned original cards, oral-history audio,
  and a separate stories/"Family Notes" feature are **out of scope** (not planned — the
  originals generally don't exist, and it keeps the public site lean and low-risk on privacy).
- **Reference content** (technique how-tos, glossary, conversion charts) is desired;
  schedule after the core recipe experience.

## Repo structure

```
.
├── AGENTS.md              # You are here — project context & conventions
├── CLAUDE.md              # Thin pointer to AGENTS.md (cross-platform)
├── CONTEXT.md             # Domain glossary (ubiquitous language)
├── .claude/
│   ├── agents/           # Custom subagents (e.g. recipe-intake) — committed
│   └── skills/           # grill-me-codex (tracked); frontend-design (local-only, gitignored)
├── docs/
│   ├── adr/               # Architecture Decision Records (see docs/adr/README.md)
│   ├── agents/            # Per-repo agent operating config (e.g. intake.md)
│   ├── architecture.md    # Architecture review (build plan, stack, phases)
│   ├── design.md          # "Counter" design system (modular tokens)
│   ├── components.md      # Component inventory (specs, states, a11y) for every UI piece
│   ├── information-architecture.md  # Site map, URLs, navigation, page inventory
│   ├── taxonomy.md        # Controlled vocabulary: course / cuisine / tags / contributor
│   ├── scaling-and-units.md  # Serving scaler + unit-conversion logic spec
│   └── recipe-schema.md   # The canonical recipe file schema
├── recipes/               # Source-of-truth recipe files (Markdown + frontmatter)
│   ├── TEMPLATE.md        # Copy-paste skeleton
│   ├── images/<slug>/     # Per-recipe photos (committed, EXIF-stripped)
│   └── *.md               # One file per recipe
├── research/              # Background research informing our decisions
└── ...                    # Astro site code (added when the site is scaffolded)
```

## How we make decisions

Significant choices (data format, framework, hosting, etc.) are recorded as
**Architecture Decision Records** in `docs/adr/`. Before changing a previously
decided direction, read the relevant ADR and supersede it with a new one rather than
editing history. See `docs/adr/README.md` for the format and how to add one.

## Working agreements for agents

- Keep this file current. When a major decision is made, record an ADR and update the
  **Stack & data format** section above.
- Prefer durable, boring, well-supported technology. This archive should outlive any
  given framework hype cycle.
- Optimize every reader-facing choice for the **least technical, oldest family member**
  first, then make sure it still delights younger users.
- Don't add social/engagement features without an ADR justifying them.
- **Strip EXIF from every committed hero photo.** Recipe hero images are committed to this
  **public** repo, so device / GPS / timestamp metadata must be removed from the committed
  source before it lands. Astro's *build derivatives* are stripped by sharp, but the committed
  `recipes/images/<slug>/hero.jpg` source is **not** stripped automatically — resizing with
  `sips` preserves EXIF. After resizing, re-encode with sharp to drop metadata. From the repo
  root (so `node_modules` resolves):
  `node -e "const s=require('sharp'),f='recipes/images/<slug>/hero.jpg';s(f).rotate().jpeg({quality:72}).toBuffer().then(b=>require('fs').writeFileSync(f,b))"`
  (sharp drops all metadata by default; `.rotate()` first bakes in any EXIF orientation).
  **Verify** with `sips -g all <file>` that no `make` / `model` / `software` / `datetime` /
  `gps` fields remain before committing.
- **Guard the guards.** CI enforces an accessibility guard (`npm run test:a11y`, axe + keyboard),
  a structured-data audit (`npm run test:jsonld`), and a performance budget (`npm run test:perf`,
  raw bytes + DOM, growth-aware). If a change touches **JS/CSS/images or bulk-adds recipes**, run
  `npm run build && npm run test:perf` locally before opening the PR and sanity-check the numbers;
  if a budget legitimately needs to rise, bump it deliberately in `scripts/perf-budget.mjs` and
  say why. Real-world CWV drift is watched weekly by `.github/workflows/perf-monitor.yml`.
