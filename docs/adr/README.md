# Architecture Decision Records (ADRs)

We record significant decisions here so future maintainers (and agents) understand
*that* a decision was made and *why* — not to fill out ceremony. Format follows
[Matt Pocock's minimal ADR convention](../../research/04-repo-setup-and-adrs.md).

## When to write an ADR

Write one only when **all three** are true:

1. **Hard to reverse** — switching later would be costly.
2. **Surprising without context** — a future reader would ask "why on earth did they do this?"
3. **A real trade-off** — genuine alternatives existed.

If a choice is obvious or trivially reversible, don't write one.

## Format

A title plus 1–3 sentences is enough:

```md
# {Short title of the decision}

{1-3 sentences: the context, what we decided, and why.}
```

Add these **only when they earn their place** (most ADRs won't need them):

- `Status:` `proposed | accepted | deprecated | superseded by ADR-NNNN` (top of file)
- `## Considered Options` — when rejected alternatives are worth remembering
- `## Consequences` — when non-obvious downstream effects matter

## Conventions

- Filename: `NNNN-kebab-slug.md`, zero-padded, sequential. Next number = highest + 1.
- **Don't edit history.** To change a past decision, write a new ADR and mark the old
  one `Status: superseded by ADR-NNNN`.
- After accepting an ADR that affects the stack, update **`../../AGENTS.md`**.

## Index

| ADR | Title | Status |
|-----|-------|--------|
| [0001](./0001-adopt-mattpocock-repo-conventions.md) | Adopt mattpocock-style repo conventions, with AGENTS.md as the canonical entry file | accepted |
| [0002](./0002-recipes-as-markdown-with-yaml-frontmatter.md) | Recipes are stored as Markdown files with structured YAML frontmatter | accepted |
| [0003](./0003-astro-static-site-on-cloudflare-pages.md) | Build with Astro as a static site, hosted on Cloudflare Pages | accepted (hosting superseded by 0006) |
| [0004](./0004-public-site-with-schema-org-json-ld.md) | The site is public and emits schema.org/Recipe JSON-LD for SEO | accepted |
| [0005](./0005-recipe-intake-via-claude-code.md) | Recipes are added/edited by an AI agent (Claude Code), not a CMS or email pipeline | accepted |
| [0006](./0006-deploy-to-s3-cloudfront-to-match-the-universe.md) | Deploy to AWS S3 + CloudFront to match the axpr cinematic universe | accepted |
| [0007](./0007-join-the-axpr-cinematic-universe.md) | Join the axpr cinematic universe (footer, hub registry, stack alignment, distinct aesthetic) | accepted |
| [0008](./0008-weight-first-research-grams-at-intake.md) | Weight-first: research and store gram weights at intake; weight display/print option | accepted |
| [0009](./0009-tailwind-v4-via-postcss.md) | Tailwind CSS v4 is wired via PostCSS, not the @tailwindcss/vite plugin | accepted |
| [0010](./0010-counter-design-system.md) | Adopt the "Counter" design system (modular, token-driven); supersedes Enamelware | accepted |
