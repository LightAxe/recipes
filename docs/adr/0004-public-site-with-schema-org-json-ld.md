Status: accepted (heritage-layer deferral dropped by ADR-0013)

# The site is public and emits schema.org/Recipe JSON-LD for SEO

The collection is published publicly so recipes are easy to share and discoverable via
search, and every recipe page emits schema.org/Recipe JSON-LD to qualify for Google
recipe rich results. Because it's public, we will not publish anything we don't want
indexed: strip EXIF/GPS from all photos, avoid home addresses and identifiable photos of
minors, and defer the heritage layer (scanned original cards, oral-history audio) which
may carry more personal data until we've decided per-item what is safe to make public.

## Consequences

- "Lean v1" deliberately excludes scans/audio partly for this privacy reason (see AGENTS.md scope).
- If the family later wants private material online, that needs a new ADR (auth gating,
  e.g. Cloudflare Access) — public-by-default is the current stance.

## Update — superseded in part by ADR-0013

The "defer the heritage layer … until we've decided per-item what is safe to make public"
language above is **no longer operative**: [ADR-0013](./0013-no-heritage-layer.md) drops the
heritage layer from scope *permanently* — it is out of scope, not deferred pending a privacy
review. The core decision this ADR records (public site + schema.org JSON-LD, strip EXIF/GPS,
no un-vetted personal data) still stands; only the heritage-deferral reasoning changed. The
original text is preserved above per the don't-edit-history convention (`docs/adr/README.md`).
