# Plan Review Log: Phase 4 — Reference content (Tips, Conversions, About) + nav + no-photo card
Act 1 (grill) complete — plan locked with the user. MAX_ROUNDS=5.

Grill outcomes (Rob's calls): ship Tips hub + Conversions + About + #14 + nav in one phase;
Tips hub seeded with general how-tos + Conversions anchor (I draft, Rob edits); Conversions from
a curated, cited data module → bespoke data-driven page; About is contribute-only (no story yet);
no-photo card = course line-icon on a uniform one-accent tint; header gains Tips + About with a
mobile hamburger sheet (IA §4). Technical calls taken by Claude: tips collection schema (flat, no
tags); Article/AboutPage/ItemList JSON-LD (no HowTo); hamburger built on native `<details>` for a
no-JS base; uniform tint (no per-course palette); search-result cards unchanged.

## Round 1 — Codex
**Findings**
- [High] tips Zod schema lists `body`, but Astro content schemas validate FRONTMATTER only (body is `entry.body`/`render(entry)`). Fix: drop `body` from the schema.
- [High] plan says reuse `units.ts` constants, but `ML`/`G` are module-private (only `KNOWN_UNITS` exported). Fix: export the needed constants and import them.
- [High] `/tips/[slug]` + a bespoke `/tips/conversions/` collide if a tip named "conversions" exists — no reserved-slug guard. Fix: reserve/exclude `conversions` (and future reserved slugs) in the loader/getStaticPaths + validate.
- [Medium] new tips/about/conversions pages could enter Pagefind, but search.ts only renders `/recipes/…/` results. Fix: keep them out of the index (no `data-pagefind-body`) OR broaden search intentionally.
- [Medium] `itemListJsonLd` is recipe-specific (emits `/recipes/${id}/`). Fix: add a generic itemList helper for the tips hub.
- [Medium] plan omits `BreadcrumbList` JSON-LD on the new breadcrumbed pages (Phase 3 emits it). Fix: add `breadcrumbJsonLd` to tips/about/conversions + smoke-parse.
- [Medium] orphaned `reference/useful-information.md` ignored. Fix: migrate/split/defer it explicitly.
- [Medium] footer "gains Tips + About" understates it — current footer has no quick-link set; IA wants Recipes/Categories/Tips/About/RSS + a contribute line. Fix: implement the full footer IA.
- [Low] hamburger `<summary>` needs an accessible "Menu" name; don't duplicate stale ARIA — rely on native `<details>` state or sync `aria-expanded` on the `toggle` event.

VERDICT: REVISE

### Claude's response
All 9 accepted.
- **Schema:** dropped `body` from the tips Zod schema (frontmatter-only; body via `render(entry)`).
- **units.ts:** will export the generic volume constants (`ML`) so `conversions.ts` shares one source of truth for generic volume math.
- **Reserved slug:** `conversions` is reserved — the tips collection/getStaticPaths excludes it and a check fails the build if a `tips/conversions.md` is ever added; `/tips/conversions/` stays the bespoke page.
- **Pagefind:** the new pages deliberately get **no `data-pagefind-body`** — search stays recipe-only this phase (broadening it is out of scope). Noted explicitly + a smoke check that they aren't indexed.
- **JSON-LD:** add a **generic `itemListJsonLd`** (URL+name pairs) for the hub; add **`breadcrumbJsonLd`** to every new breadcrumbed page.
- **reference/useful-information.md:** **migrate** it into `tips/` as the anchor **family** reference tip (reshape recipe-frontmatter → tip frontmatter; keep its prose; roasting temps stay as *transcribed lore with the existing caveat*, NOT elevated into the authoritative Conversions tables). Delete the orphaned `reference/` file. This replaces one of my planned generic tips with real family content.
- **Footer:** implement the fuller IA footer (quick links Recipes/Categories/Tips/About/RSS + "Add a recipe — email Rob" line), not just two links.
- **Hamburger:** the `<summary>` gets an accessible "Menu" name (visible label or `aria-label`); rely on native `<details>` open state, only mirroring `aria-expanded` via the `toggle` event if needed — no hand-managed stale ARIA.

## Round 2 — Codex
Confirmed 8/9 R1 findings addressed. One remaining:
- [Medium] "no `data-pagefind-body` keeps new pages out of search" is wrong — Pagefind exclusion is `data-pagefind-ignore` or index config; pages without a body tag can still be indexed. Fix: mark new pages `data-pagefind-ignore` or scope Pagefind to `/recipes/**`, then smoke-test no non-recipe result URLs.

VERDICT: REVISE

### Claude's response — PARTIAL REJECT + harden
Rejected the mechanism claim (logged reason): Pagefind's documented behavior is that once ANY `data-pagefind-body` exists on the site, it indexes ONLY body-tagged pages and ignores the rest. Verified in our Phase 3 build: "Found a data-pagefind-body element on the site. Ignoring pages without this tag" → indexed exactly 77 (the recipe pages). `data-pagefind-ignore` is for subtrees of *indexed* pages, so it's the wrong tool here; the correct exclusion IS the absence of a body tag. Adopted Codex's verification idea and named the hard guarantee: (1) new pages carry no `data-pagefind-body` (excluded by construction); (2) `search.ts` `safeRecipeUrl` allowlist guarantees only `/recipes/…/` ever renders even if indexing changed; (3) added a smoke assertion that the built Pagefind index/search surfaces only `/recipes/…/` URLs.

## Round 3 — Codex
No new material issues found.

The prior findings are addressed in `PLAN.md`, and the rejected Pagefind finding now has a logged rationale plus a useful smoke-test guard: raw Pagefind/search output must surface only `/recipes/.../` URLs. That is enough to keep the plan implementable without expanding scope.

VERDICT: APPROVED