Status: accepted

# Adopt mattpocock-style repo conventions, with AGENTS.md as the canonical entry file

We want a low-ceremony, AI-agent-friendly repo, so we adopt Matt Pocock's conventions
(`skills` repo): a domain glossary in `CONTEXT.md`, minimal one-paragraph ADRs in
`docs/adr/NNNN-slug.md` created lazily, and agent operating config in `docs/agents/`.
We deliberately diverge on one point: instead of "edit whichever of CLAUDE.md/AGENTS.md
exists," we make **`AGENTS.md` the single canonical entry file** and keep `CLAUDE.md` as
a thin pointer to it, so the setup is portable across any AI coding tool, not just Claude.

## Consequences

- The mattpocock skills' assumption that `CLAUDE.md` is the agent home doesn't hold
  here; anything tool-specific still goes in `CLAUDE.md`, but project truth lives in
  `AGENTS.md`.
- We use no ADR tooling (no `adr-tools`/`log4brains`); ADRs are hand- or agent-written
  markdown, numbered by max + 1.
