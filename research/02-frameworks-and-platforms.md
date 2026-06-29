# Frameworks, Platforms & Tools for a Family Recipe Site

*Compiled 2026-06-29. Star counts and free-tier figures are point-in-time snapshots;
re-verify before building. Source URLs throughout.*

Our requirements — capture paper recipes, accept emailed contributions the maintainer
adds, mobile + desktop friendly, printable, photo support, **not** a social network —
point strongly toward a **static site**. The self-hosted apps are surveyed for
completeness but are mostly overkill for a display-and-print archive. Recommendation at
the end.

---

## 1. Self-hosted recipe managers

All are **dynamic server applications**: a host running 24/7, a database, ongoing
patching/backups. None has native **Cooklang** support (only third-party converters
bridge to them — <https://cooklang.org/blog/18-open-source-recipe-managers-2026/>).
schema.org/JSON-LD URL scraping is supported by Mealie, Tandoor, RecipeSage, KitchenOwl.

### Mealie
- **What:** Self-hosted recipe manager + meal planner, family-oriented, REST API.
- **Stack:** Python backend, Vue/TS frontend; SQLite default (no separate DB server) or PostgreSQL.
- **Hosting:** Docker. Lowest-ops of the full apps (SQLite default).
- **Import/export:** URL import via schema.org scraping; migrations from other platforms. **No native Cooklang.**
- **Print:** Basic print view; layout limitations reported; PDF export long-requested (<https://github.com/mealie-recipes/mealie/issues/1306>).
- **Photos / multi-user:** Yes / Yes (designed for families).
- **Activity:** ~12.6k★, AGPL-3.0, v3.20.1 (2026-06-26), actively maintained. <https://github.com/mealie-recipes/mealie>
- **Verdict:** Best-balanced full app if you want one. Largest community; lowest maintenance of the dynamic options.

### Tandoor Recipes
- **What:** Feature-rich "kitchen ERP" — recipes, meal planning, nutrition, cost calc.
- **Stack:** Django + Vue 3; **PostgreSQL required in production**. Needs ≥2 GB RAM to build; runs Postgres + NGINX.
- **Import/export:** Strong URL import (ld+json/microdata). **No native Cooklang.**
- **Print:** Yes — dedicated printing views (best print support in this group).
- **Photos / multi-user:** Yes (compression, AI recognition) / Yes (permissions).
- **Activity:** ~8.4k★, AGPL-3.0 + Commons Clause, v2.6.11 (2026-06-21). <https://github.com/TandoorRecipes/recipes>
- **Verdict:** Most powerful, but heaviest to run and maintain.

### Grocy
- Groceries/household ERP; recipes are secondary. PHP + SQLite, lightweight Docker. **No recipe URL import / schema.org / Cooklang.** ~9.2k★, MIT. <https://github.com/grocy/grocy> — **Poor fit** (inventory tool first).

### RecipeSage
- Collaborative recipe keeper + meal planner (PWA). TS/Node, Prisma, **PostgreSQL**. URL import via schema.org + OCR. Print/photos/multi-user: yes. ~905★ (smallest community), AGPL-3.0 non-commercial dual license. <https://github.com/julianpoy/RecipeSage> — capable but **solo project, longevity risk**.

### KitchenOwl
- Grocery-list + recipe manager, real-time sync; **self-described "Public Alpha."** Flutter/Dart + Flask, SQLite. URL import via `recipe-scrapers`. Printing is a weak spot (Flutter UI). ~3.4k★, AGPL-3.0, <1.0. <https://github.com/TomBursch/kitchenowl>

### Cooklist
- **Commercial, cloud-only mobile app** (US grocery loyalty integration). **Not self-hostable, not open source.** <https://cooklist.com/> — exclude. *(Not to be confused with **Cooklang**, the plain-text `.cook` markup — see §2.)*

### Are these overkill?
**Yes, for our needs.** Each requires a server kept online, a DB to back up,
dependency/CVE patching, migration risk — and bundles meal planning, shopping lists,
nutrition, and multi-user permissions we don't need. Cooklang's project explicitly
raises the "can you still read these recipes in 30 years?" durability concern against
DB-backed apps (<https://cooklang.org/blog/52-cooklang-vs-tandoor/>). A static site gives
near-zero maintenance, file-based backups, and excellent print/mobile control. A full
app is only justified if we later want live web-clipping, collaborative multi-member
editing, meal planning, or auto shopping lists. If we do, **Mealie** is the best family pick.

---

## 2. Static-site approaches (best fit)

### The four SSGs (verified 2026-06-29)

| SSG | Language | Stars | Notes for a recipe archive |
|---|---|---|---|
| **Hugo** | Go (single binary, no Node) | ~88.8k | Fastest builds; Markdown + frontmatter; taxonomies for tags/cuisine/course. Steepest templating (Go templates). <https://github.com/gohugoio/hugo> |
| **Astro** | JS/TS (Node) | ~60.6k | Best modern DX; **Content Collections + Zod** = typed, schema-validated recipe frontmatter; built-in image pipeline. Heavier build. <https://github.com/withastro/astro> |
| **Jekyll** | Ruby | ~51.5k | Native to GitHub Pages (zero-config deploy); `_recipes` collection; slower Ruby builds. <https://github.com/jekyll/jekyll> |
| **Eleventy (11ty)** | JS (Node) | ~19.7k | Config-light, ships no client JS; flexible templating; good middle ground. <https://github.com/11ty/eleventy> |

All four handle "Markdown files as recipes" well; the difference is template syntax and build speed.

### Recipe-specific themes/starters
Only two have meaningful traction; treat the rest as low-bus-factor (fork one or build a thin custom layout rather than depend on a stale theme):
- **clarklab/chowdown** (Jekyll) — **~661★**, push 2026-04-15. Flagship recipe theme; Markdown recipes, sub-recipes, print-friendly. <https://github.com/clarklab/chowdown>
- **seanlane/gochowdown** (Hugo port) — ~73★. <https://github.com/seanlane/gochowdown>
- **deranjer/hugo-cookbook** — ~36★ (Bulma + fuse.js search). <https://github.com/deranjer/hugo-cookbook>
- **ntk148v/hugo-cuisine-book** — ~20★, recently active. <https://github.com/ntk148v/hugo-cuisine-book>
- Astro: no maintained cookbook *theme*; sites are hand-rolled with Content Collections.
- CloudCannon/treat-jekyll-template — ~143★ (food/baking blog, CMS-editable). <https://github.com/CloudCannon/treat-jekyll-template>

### Markdown + frontmatter → schema.org JSON-LD
The established pattern:
1. One Markdown file per recipe; structured fields in frontmatter (`prepTime`/`cookTime` as ISO-8601 `PT30M`, `recipeYield`, `recipeIngredient` list, `recipeInstructions` list, `recipeCategory`, `recipeCuisine`, `keywords`).
2. A template emits a `<script type="application/ld+json">` block conforming to <https://schema.org/Recipe> — same concept across all four SSGs, only syntax differs.
3. Validate with Google Rich Results Test before publishing.
Helper generators: <https://webcode.tools/generators/json-ld/recipe> · <https://recipekit.com/pages/free-recipe-schema-generator>. No single tool ingests frontmatter and outputs *both* printable cards and JSON-LD — that glue lives in the SSG template layer.

### Cooklang — a notable alternative
Plain-text `.cook` markup (`@flour{200%g}`, `#pot`, `~{10%minutes}`) that parses to structured JSON; Git-friendly.
- **cooklang/cookcli** — **~1,317★**, Rust, push 2026-06-26 (active). `cook build web` generates a **self-contained static website** (HTML/CSS + client-side search) from a folder of `.cook` files. Also does shopping lists. **Does not emit schema.org/JSON-LD** (no SEO structured data out of the box). <https://github.com/cooklang/cookcli>
- **Tradeoff:** machine-readable ingredients/scaling/shopping lists + one-command site, but its own markup (learning curve) and no SEO JSON-LD. Markdown+frontmatter on a mainstream SSG is more flexible for design/SEO but you author the JSON-LD template yourself.

### Free hosting (verified June 2026)

| | Bandwidth (free) | Builds | Custom domain + SSL | Git auto-deploy | Commercial on free | Surprise-bill risk |
|---|---|---|---|---|---|---|
| **Cloudflare Pages** | **Unlimited** | 500/mo | Yes (≤100/project) | Yes | **Allowed** | None (no overage) |
| **GitHub Pages** | 100 GB (soft) | 10/hr (soft); 1 GB site cap | Yes | Yes (Actions) | No e-commerce; static personal OK | None (no paid tier) |
| **Netlify** | ~15 GB (300 credits) | credit-metered | Yes | Yes | **Allowed** | Site pauses at cap |
| **Vercel Hobby** | ~100 GB | 100 deploys/day | Yes | Yes | **Non-commercial only** | Feature lock ~30 days |

Sources: <https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits> · <https://developers.cloudflare.com/pages/platform/limits/> · <https://docs.netlify.com/manage/accounts-and-billing/billing/> · <https://vercel.com/docs/limits/fair-use-guidelines>

**Gotchas:** Vercel Hobby's non-commercial clause is broad (even a "buy me a coffee" link
violates it). Netlify's credit model effectively caps ~15 GB/mo and pauses the site at
cap. GitHub Pages limits are soft (email, not a bill) with a 1 GB site ceiling.
Cloudflare's unlimited bandwidth is structural to its CDN business, not a promo.

---

## 3. The "email a recipe" intake pattern

Automated-path architecture: inbound-email service → parse MIME → GitHub REST API
(`PUT /repos/{o}/{r}/contents/{path}`, base64 body; committer name+email required or
HTTP 422) → optionally open a PR so you still curate. Direct commit + auto-deploy is
simpler for a single curator. Docs: <https://docs.github.com/en/rest/repos/contents>

- **Approach 1 — Manual transcription (recommended baseline).** Family emails free-form; you write the Markdown and commit. Zero infra, zero maintenance, no security surface, and you normalize every entry anyway. Fine at a few recipes/month.
- **Approach 2 — Email → parse → commit/PR.** Most fragile/highest-maintenance (messy/forwarded email, attachments, inline images, spam, token rotation). Best variant: **Cloudflare Email Routing + Email Worker → GitHub PR** (one free platform; parse MIME with `postal-mime`). Route to a PR to stay curator. <https://developers.cloudflare.com/email-routing/email-workers/> — Note: **SendGrid Inbound Parse no longer has a permanent free tier** (trial only since 2025).
- **Approach 3 — Form instead of email.** **Google Forms → Sheet → scheduled GitHub Action** is the simplest durable self-service path (everyone can use a Form, no parsing fragility, you review before publishing).
- **Approach 4 — Git-based CMS (friendly UI, still git + files).** No database; commits Markdown to the repo:
  - **Sveltia CMS** — ~2.5k★, very active, drop-in Decap replacement, mobile support; beta. <https://github.com/sveltia/sveltia-cms>
  - **Pages CMS** — ~3.8k★, "simplest CMS for GitHub"; hosted free or self-host; editors need GitHub accounts. <https://pagescms.org/>
  - **Decap CMS** (ex-Netlify CMS) — ~19.2k★, most established, MIT. **Caveat:** Netlify Identity + Git Gateway deprecated, so the old "invite by email, no GitHub account" flow is gone; use GitHub OAuth or **DecapBridge** (free; family logs in with Google/Microsoft/password). <https://decapbridge.com/>
  - **Tina CMS** — ~13.6k★, live visual editing; heavier than needed.
  - **Static CMS — discontinued Sep 2024, do not adopt.**

---

## 4. Photo handling for static sites

**Build-time optimization is the durable default.** Engine under most pipelines is
**sharp** (libvips; ~4–5× faster than ImageMagick — <https://sharp.pixelplumbing.com/>).
**imagemin is unmaintained** and **Squoosh effectively deprecated** — prefer sharp.
- **Astro** `<Image>`/`<Picture>` (`astro:assets`, uses sharp) — least setup. <https://docs.astro.build/en/guides/images/>
- **Eleventy** `@11ty/eleventy-img` — multiple sizes/formats, `<picture>`/`srcset`, build cache. <https://www.11ty.dev/docs/plugins/image/>
- **Hugo** built-in `Resize`/`Fit`/`Fill` (WebP since 0.83). <https://gohugo.io/content-management/image-processing/>

**Formats & responsive:** ship AVIF (~20–30% smaller than WebP, slower encode) + WebP +
JPEG fallback via `<picture>`, at ~3–4 widths (320/640/960/1280). Always set `sizes`
(without it the browser assumes `100vw` and over-downloads), plus `loading="lazy"`,
`decoding="async"`, and explicit width/height to avoid layout shift.

**Where to store:**
- **In-repo plain git is best here.** For dozens-to-low-hundreds of optimized photos (tens-to-few-hundred KB each) you're far under GitHub's 100 MB/file limit; the build is self-contained with no external account to expire. **Skip Git LFS** and **skip image CDNs** (each adds a dependency that can be suspended): Cloudinary 25 credits/mo **suspends** at quota (<https://cloudinary.com/pricing>); Cloudflare Images 5,000 transforms/mo; ImageKit 20 GB bw + 3 GB storage; imgix has no permanent free tier.

**Licensing & privacy (important for family photos):**
- **Strip EXIF/GPS before committing** — one geotag can reveal a home address or a child's location. `exiftool -all= -overwrite_original_in_place -r .` (<https://exiftool.org/>). SSG re-encoding usually drops most EXIF in derivatives, but verify — it's a backstop, not a guarantee.
- "Unlisted" ≠ private; `noindex`/`robots.txt` are requests, not access control. For real privacy put the site behind authentication (Cloudflare Access, host password protection).
- Obscure/omit identifiable faces of minors; AI scrapers harvest children's photos.
- Only publish your own photos — ingredient lists aren't copyrightable, but other sites' food photos and written descriptions are.

---

## Recommendation

**Build a static site: Markdown + YAML frontmatter recipes on a mainstream SSG, images
optimized at build time and committed to the repo, hosted free on Cloudflare Pages (or
GitHub Pages) with auto-deploy from GitHub, grown by manual/CMS-assisted transcription of
emailed recipes.** This matches every requirement — responsive mobile/desktop, a real
printable version via `@media print`, photos, recipe rich cards via schema.org JSON-LD —
with essentially zero ongoing maintenance, file-based backups, no database, no server to
patch, and decades-long durability. The self-hosted apps are overkill: a 24/7 server, a
database, and patching/migration risk for features we don't need.

Concrete stack:

1. **Generator — Astro** (typed/validated frontmatter via Content Collections + Zod keeps emailed recipes consistent; best built-in image pipeline) or **Hugo** (fastest, single binary; fork **gochowdown**/**hugo-cookbook** for a head start). For a proven recipe theme on the easiest GitHub Pages path, **Jekyll + Chowdown**. Consider **Cooklang + cookcli** only if machine-readable ingredients/scaling/shopping-lists matter more than SEO (no JSON-LD).
2. **Recipes** as one Markdown file each with structured frontmatter; a template renders schema.org Recipe JSON-LD and a print stylesheet.
3. **Photos** optimized with sharp via the SSG (AVIF+WebP+JPEG, `<picture>`/`srcset`/`sizes`), EXIF stripped with ExifTool, committed to the repo. No LFS, no image CDN.
4. **Hosting — Cloudflare Pages** (unlimited bandwidth, free SSL + custom domain, no commercial restriction, no surprise bill) deploying from a **GitHub** repo; **GitHub Pages** is the equally-durable runner-up. **Avoid Vercel Hobby** (non-commercial clause); be wary of **Netlify**'s tightened free tier.
5. **Email intake — start with manual transcription** (you curate anyway; zero infra). Add a **git-based CMS (Sveltia CMS or Pages CMS)** for a friendlier editing form while staying on git. Only build an automated **Cloudflare Email Worker → GitHub PR** pipeline if volume justifies the fragility — and route it to a PR so you stay curator.

**Why this wins:** free, no component that can send a surprise bill or be suspended,
recipes stored as plain portable files readable in 30 years, and the only recurring task
— adding an emailed recipe — stays a 5-minute commit. Social-network-free by construction.
