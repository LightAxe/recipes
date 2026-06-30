Status: accepted

# Staged launch via a single `SITE_LIVE` gate

The site has its real domain (`site = https://recipes.axpr.net`) and emits full SEO
(canonical, schema.org JSON-LD, RSS, sitemap), but must stay **non-public** until real
recipes are imported. A single env flag **`SITE_LIVE`** (default `false`, in
`src/lib/site.ts`) ties together every indexability surface: when `false`, pages carry
`<meta robots noindex>` and `robots.txt` does **not** advertise the sitemap; when `true`
(go-live), noindex is dropped and `robots.txt` advertises `sitemap-index.xml`. CI builds
and smoke-tests **both** modes so neither rots.

## Why

- Avoids the contradiction Codex flagged: publishing canonical/sitemap/RSS crawl URLs
  while telling crawlers to drop every page. One flag, no half-states.
- No `robots.txt Disallow: /` — that would block crawlers *before* they could read the
  `noindex`. Staging isn't deployed; if a pre-launch build is ever hosted, gate it at the
  CDN/auth instead.

## Consequences

- Go-live is flipping `SITE_LIVE=true` (plus actually deploying — ADR-0006) — not a code change.
- The smoke test cross-checks the gate: robots advertises a sitemap **iff** pages aren't noindex.
