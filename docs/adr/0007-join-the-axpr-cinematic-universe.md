Status: accepted

# Join the axpr cinematic universe (footer, hub registry, stack alignment, distinct aesthetic)

This site joins Rob's family of sites. Concretely: (1) it carries the signature footer
**"Part of the [axpr](https://axpr.net) cinematic universe"** like the others; (2) it
gets added to the hub registry `personal-site/src/data/site.ts` as a new project with a
category tag (proposed: `family`); (3) it aligns its stack with the Astro siblings —
**Astro 6 + Tailwind CSS 4 (`@tailwindcss/vite`) + Node ≥22 + TypeScript + content
collections** — and uses Cloudflare Web Analytics; and (4) per the family's design ethos
(and the Databricks `frontend-design` skill installed in `.claude/skills/`), it commits
to its **own distinct bold aesthetic** rather than copying a sibling — no two universe
sites look alike.

## Consequences

- The footer link and an entry in the hub registry are required before launch (the
  registry edit lives in the `personal-site` repo, so Rob makes that change).
- Adopting Tailwind 4 + content collections keeps this repo idiomatic with axpr.net and
  subterrans; ADR-0002/0003 already chose Astro + Markdown content.
- The aesthetic is chosen deliberately (see `docs/design.md`), distinct from the
  terminal-green hub, the investigative-sepia of goatmeal, the gothic rust of
  zombietrailers, the retro-pixel of subterrans, and the diner-zine of pollicio.us.
