Status: accepted (supersedes the hosting choice in ADR-0003)

# Deploy to AWS S3 + CloudFront to match the axpr cinematic universe

Every sibling site (axpr.net, subterrans, goatmeal, zombietrailers, fasterpack,
pollicio.us) deploys to **AWS S3 + CloudFront via GitHub Actions with OIDC** (no
long-lived secrets), with DNS in **Route 53** and **Cloudflare Web Analytics** injected
at build time. To keep this site consistent with the family Rob already operates and
reuse his existing tooling/mental model, we deploy the same way instead of Cloudflare
Pages (ADR-0003's original choice). The static-site architecture is unchanged; only the
host differs.

## Considered Options

- **Cloudflare Pages** (ADR-0003) — simpler and unlimited-bandwidth, but an outlier
  versus the rest of the universe; rejected for consistency.
- **GitHub Pages** — also an outlier; rejected.

## Consequences

- Reuse the `deploy.yml` pattern from `personal-site`/`goatmeal_org` (two-pass S3 sync:
  long-cache immutable assets + short-cache HTML; CloudFront invalidation on deploy).
- Needs an S3 bucket, a CloudFront distribution, a Route 53 record, and a GitHub OIDC
  role — i.e. a small amount of infra to stand up (Rob's other repos are templates).
- Requires a domain (see open questions in `docs/architecture.md`).
