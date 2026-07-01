Status: accepted

# No heritage layer — attribution and notes only

Earlier docs framed a future **heritage layer** — scanned original cards, oral-history
audio, per-recipe provenance chains, a moderated "Family Notes" feature, and a `/stories/`
section — as deferred to a later phase (ADR-0004 consequences, AGENTS.md scope,
architecture §14 phase 7).

We are dropping it from scope. In practice the original cards generally don't exist, family
commentary already lives in each recipe's free-form `notes`, and audio/stories don't fit a
recipe site.

## Decision

The recipe model is **name-only `contributor` attribution plus free-form `notes`** —
nothing more. No scanned cards, no oral-history audio, no provenance chains, no separate
"Family Notes" feature, and no `/stories/` collection. This is a permanent scope decision,
not a deferral.

## Consequences

- The build roadmap (architecture §14) ends at **phase 6 (polish & launch)** — there is no
  heritage phase.
- ADR-0004's privacy reasoning for excluding scans/audio still holds; they are simply out
  of scope now rather than "deferred until we decide per-item."
- If the family ever wants private material (scans/audio) online, that remains a fresh-ADR
  decision (auth gating, e.g. Cloudflare Access), per ADR-0004 — public-by-default stands.
