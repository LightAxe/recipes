Status: accepted

# No heritage layer — attribution and notes only

Earlier docs framed a future **heritage layer** — scanned original cards, oral-history
audio, per-recipe provenance chains, a moderated "Family Notes" feature, and a `/stories/`
section — as deferred to a later phase (ADR-0004 consequences, AGENTS.md scope,
architecture §14 phase 7).

We are dropping it from scope. In practice the original cards generally don't exist, family
commentary already lives in each recipe's free-form `notes` and Markdown body, and a
*separate*, cross-recipe stories/heritage section doesn't fit a recipe site.

## Decision

Each recipe carries **name-only `contributor` attribution, free-form `notes`, and its optional
Markdown body** (a single recipe's headnote / history / serving suggestions, rendered via the
"Read more" disclosure — see `recipe-schema.md` and `docs/agents/intake.md`). What's dropped is
the **heritage *layer*** on top of that: no scanned original cards, no oral-history audio, no
per-recipe provenance chains, no moderated "Family Notes" feature, and **no separate `/stories/`
collection**. This is a permanent scope decision, not a deferral.

> Scope boundary: a recipe's own headnote/story (its Markdown body) stays — that's part of the
> recipe. "No stories" refers to the *separate* `/stories/` narrative section and the heritage
> apparatus (scans/audio/provenance), not to per-recipe prose.

## Consequences

- The build roadmap (architecture §14) ends at **phase 6 (polish & launch)** — there is no
  heritage phase.
- ADR-0004's privacy reasoning for excluding scans/audio still holds; they are simply out
  of scope now rather than "deferred until we decide per-item."
- If the family ever wants private material (scans/audio) online, that remains a fresh-ADR
  decision (auth gating, e.g. Cloudflare Access), per ADR-0004 — public-by-default stands.
