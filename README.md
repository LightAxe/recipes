# Ogilvie Family Recipes

A durable, multi-generational family recipe website — to cook from, print, and pass down.
Part of the [axpr](https://axpr.net) cinematic universe.

> **Status:** Phase 1 (scaffold). A thin vertical slice — the content→page pipeline in the
> **"Counter"** design system (modular tokens, light + dark), with one example recipe. Not
> yet deployed (pages are `noindex`). See [`PLAN.md`](./PLAN.md) for the Phase 1 plan and
> [`docs/`](./docs) for the architecture, design system, and decisions.

## Project docs

- **[AGENTS.md](./AGENTS.md)** — the canonical project brief (read this first). `CLAUDE.md`
  points here for cross-tool compatibility.
- **[docs/architecture.md](./docs/architecture.md)** — build architecture & phases.
- **[docs/design.md](./docs/design.md)** — the "Enamelware" design system.
- **[docs/recipe-schema.md](./docs/recipe-schema.md)** — the recipe file format.
- **[docs/adr/](./docs/adr)** — architecture decision records.
- **[research/](./research)** — the background research behind the decisions.

## Develop

```sh
npm install
npm run dev        # local dev server
npm run check      # astro check (types + content schema)
npm run build      # static build → dist/
npm run smoke      # post-build smoke test
npm run format     # Prettier
```

Requires Node ≥ 22.12.

## Recipes

Recipes live as Markdown + structured frontmatter in [`recipes/`](./recipes) (decoupled
from the site code so the archive outlives any framework). New recipes are added via the
`recipe-intake` agent — see [`docs/agents/intake.md`](./docs/agents/intake.md).
