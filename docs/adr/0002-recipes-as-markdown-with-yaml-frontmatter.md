Status: accepted

# Recipes are stored as Markdown files with structured YAML frontmatter

Each recipe is one Markdown file whose YAML frontmatter holds structured fields
(schema.org-aligned keys plus our own), with the body for free prose. We chose this over
a database, over hand-authored schema.org JSON-LD, and over purpose-built formats
(Cooklang, RecipeMD) because plain text in git is the most durable for a decades-long
archive, the easiest to read/diff, and maps almost 1:1 onto schema.org/Recipe so we can
generate JSON-LD at build time. Ingredients are stored structured (quantity/unit/item)
so the site can scale and convert them — see `docs/recipe-schema.md`.

## Considered Options

- **Cooklang** — great for auto shopping-lists/scaling and has many parsers, but its
  `@ingredient{}` syntax adds friction and it emits no schema.org for SEO. Reconsider if
  we ever want its app ecosystem.
- **schema.org JSON-LD as source** — the web standard, but verbose and miserable to
  hand-edit; we generate it instead.
- **A recipe app/database** (Mealie, Tandoor) — rejected in ADR-0003's reasoning: server
  + DB + patching for features we don't want.
