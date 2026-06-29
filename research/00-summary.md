# Executive Summary & Recommendations

*Compiled 2026-06-29. This is the short version of the four research files in this
directory. Read the individual files for sources and detail.*

## The question

How should we store, present, and grow a multi-decade family recipe collection that
works for everyone from boomers to Gen Alpha, on mobile/desktop/print, with photos,
grown by family emailing recipes to a maintainer — without it becoming a social network
or a maintenance burden?

## The shape of the answer

Three decisions reinforce each other:

1. **Store recipes as plain text in git** → durable for decades, readable without any
   special software, diff-friendly, free to back up.
2. **Build a static website** from those files → no server, no database, near-zero
   maintenance, free hosting, full control over mobile/print/accessibility.
3. **Generate the "smart" web layer at build time** (schema.org JSON-LD for search,
   responsive images, print stylesheet) → modern web benefits without coupling the
   archive to any one app's lifespan.

This deliberately rejects the self-hosted recipe apps (Mealie, Tandoor, etc.): they need
a 24/7 server + database + patching and bundle meal-planning/shopping features we don't
want. (See [`02`](./02-frameworks-and-platforms.md).)

## Recommendations by area

### Data format → Markdown + YAML frontmatter ([details](./01-recipe-data-schemas.md))
- One `.md` file per recipe. Metadata in YAML frontmatter using **schema.org-aligned
  keys** (`prepTime`/`cookTime`/`totalTime` as ISO-8601 `PT30M`, `recipeYield`,
  `recipeCategory`, `recipeCuisine`, `keywords`, `image`, plus our heritage fields).
- **Why:** easiest format for non-technical relatives to read/edit, most durable
  tooling, maps almost 1:1 to schema.org for SEO.
- **Generate** schema.org/Recipe JSON-LD at build for Google rich results — never
  hand-author it.
- **Alternative:** Cooklang if we want auto shopping-lists/scaling and don't mind its
  `@ingredient{}` syntax. Avoid h-recipe (legacy) and Open Recipe Format (unmaintained).

### Site framework → Astro or Hugo ([details](./02-frameworks-and-platforms.md))
- **Astro** — typed/validated frontmatter (Content Collections + Zod) keeps emailed
  recipes consistent; best built-in image pipeline. Recommended default.
- **Hugo** — fastest, single binary; recipe starters to fork (`gochowdown`,
  `hugo-cookbook`).
- **Jekyll + Chowdown** — easiest path if we want a proven recipe theme on GitHub Pages.

### Hosting → Cloudflare Pages (or GitHub Pages) ([details](./02-frameworks-and-platforms.md))
- **Cloudflare Pages:** unlimited bandwidth, free SSL + custom domain, no commercial
  restriction, no surprise-bill risk. Deploy from a GitHub repo.
- **GitHub Pages:** equally durable runner-up, fewest moving parts.
- **Avoid** Vercel Hobby (non-commercial clause); be wary of Netlify's tightened free tier.

### Photos → optimized at build, committed to repo ([details](./02-frameworks-and-platforms.md))
- Optimize with **sharp** via the SSG (AVIF+WebP+JPEG, `<picture>`/`srcset`/`sizes`).
- **Store in-repo** for our scale; skip Git LFS and image CDNs (added dependencies that
  can be suspended).
- **Strip EXIF/GPS** with ExifTool before committing (privacy — geotags can reveal a
  home or a child's location). "Unlisted" ≠ private; gate behind auth for real privacy.

### Email intake → manual transcription first ([details](./02-frameworks-and-platforms.md))
- Start with the maintainer transcribing emailed recipes into a Markdown file and
  committing. Zero infra, and you normalize every entry anyway.
- Add a **git-based CMS** (Sveltia CMS / Pages CMS) for a friendlier editing form later.
- Only build an automated **Cloudflare Email Worker → GitHub PR** pipeline if volume
  justifies the fragility — and route to a PR so the maintainer stays curator.

### Presentation & UX → recipe-first, accessible to all ages ([details](./03-cross-generational-ux.md))
Design to the most-constrained user (older adults) as the baseline; layer youthful
appeal on top. Key features:
- **Recipe card high on the page** + "Jump to Recipe"; short skippable headnote.
- **Cook Mode** (Screen Wake Lock API), tap-to-check ingredients/steps, tappable timers.
- **Serving scaler** (1x/2x/3x) and **unit toggle** (imperial/metric, volume/weight).
- **Accessibility:** ~18–20px base font resizable to 200%; contrast ≥4.5:1 (7:1 where
  cheap); ~48px tap targets; no hover-only; both search and browse; plain language.
- **Mobile-first** single-column; sticky ingredients beside method on larger screens.
- **Print:** `@media print` stylesheet, `break-inside: avoid`, an optional **4×6 recipe
  card** view, a "Print Recipe" button.
- **Reference content:** a technique/how-to hub + glossary + conversion charts, linked
  inline from recipe terms.

### Heritage character → dual-layer ([details](./03-cross-generational-ux.md))
Clean recipe up front; family material attached/alongside, never burying it:
- Structured **provenance** (created-by, passed-down-by, year/era, place) shown as a byline.
- **Scanned original card** displayed alongside the clean typed version (quirks preserved).
- Verbatim **"Family Notes / Variations"** block (the "Grandma added a pinch more" lore).
- Optional **audio/video** attachment (oral history); 3-2-1 backups of original scans.

### Repo conventions → mattpocock-style ([details](./04-repo-setup-and-adrs.md))
- `CONTEXT.md` glossary, minimal one-paragraph ADRs in `docs/adr/NNNN-slug.md`, agent
  config in `docs/agents/`. `AGENTS.md` canonical, `CLAUDE.md` a pointer. Already set up.

## Recommended starting stack (one line)

**Astro** site + **Markdown/YAML** recipes (schema.org keys) + build-time **JSON-LD** &
**sharp** images committed to git + **Cloudflare Pages** hosting + **manual email
intake** to start — recipe-first, accessibility-baseline UI with cook mode, print, and a
heritage layer.

## Decisions made (2026-06-29)

The maintainer's answers, now recorded as ADRs in `docs/adr/`:

- **Public, SEO-friendly** site with schema.org JSON-LD (ADR 0004).
- **Astro** static site on **Cloudflare Pages** (ADR 0003).
- **Markdown + structured YAML frontmatter** recipes; spec in `docs/recipe-schema.md` (ADR 0002).
- **Intake via Claude Code** — maintainer provides recipes, the agent writes the files;
  procedure in `docs/agents/intake.md` (ADR 0005).
- **Full interactive recipe pages at v1**; **heritage layer deferred** to a later phase.
  See "v1 scope" in `AGENTS.md`.

Still open / deferred: custom domain name; when to build the reference-content hub; and
the design of the later heritage phase (scans, provenance, audio, Family Notes).
