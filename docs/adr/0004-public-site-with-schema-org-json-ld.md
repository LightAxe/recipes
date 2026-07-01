Status: accepted

# The site is public and emits schema.org/Recipe JSON-LD for SEO

The collection is published publicly so recipes are easy to share and discoverable via
search, and every recipe page emits schema.org/Recipe JSON-LD to qualify for Google
recipe rich results. Because it's public, we will not publish anything we don't want
indexed: strip EXIF/GPS from all photos, avoid home addresses and identifiable photos of
minors, and keep scanned original cards and oral-history audio out of scope (they can carry
more personal data — and the source cards generally don't exist anyway).

## Consequences

- The site deliberately excludes scans/audio partly for this privacy reason (see AGENTS.md scope).
- If the family ever wants private material online, that would need a new ADR (auth gating,
  e.g. Cloudflare Access) — public-by-default is the current stance.
