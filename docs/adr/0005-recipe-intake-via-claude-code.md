Status: accepted

# Recipes are added/edited by an AI agent (Claude Code), not a CMS or email pipeline

The maintainer provides a recipe to Claude Code (paste, photo, or forwarded email text)
and the agent creates or edits the recipe Markdown file following `docs/recipe-schema.md`,
then it's committed. We chose this over a git-based CMS and over an automated email→PR
pipeline because the maintainer is already working in Claude Code, the agent can parse
messy free-form submissions into our structured schema better than a form, and it adds
zero infrastructure. The intake procedure the agent follows lives in `docs/agents/intake.md`.

## Consequences

- The recipe schema and intake doc must stay precise enough for an agent to follow
  consistently (field names, units, file naming, EXIF stripping, alt text).
- If non-technical relatives ever need to self-serve without the maintainer, revisit with
  a git-based CMS (Sveltia/Pages CMS) — see `research/02-frameworks-and-platforms.md`.
