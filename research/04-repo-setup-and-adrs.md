# Repo Setup & ADRs — the mattpocock conventions

*Compiled 2026-06-29. How to structure this repo for AI-assisted work, with ADRs and
domain context stored in a standardized, low-ceremony way, following Matt Pocock's setup.*

---

## 1. The canonical source

The conventions come from **[`mattpocock/skills`](https://github.com/mattpocock/skills)**
— *"Skills for Real Engineers. Straight from my `.claude` directory."*

Nuance: this is **not a template you fork**. It's a collection of Claude Code "skills"
(slash-command behaviors). The ADR/context conventions are *emitted into your own repo*
by running `/setup-matt-pocock-skills` + `/domain-modeling`, but the conventions are
documented in plain markdown in the repo, so we can replicate them by hand without
installing anything.

A separate repo people confuse with it: **[`mattpocock/agent-rules-books`](https://github.com/mattpocock/agent-rules-books)**
— book-derived `AGENTS.md` rule sets (Clean Code, DDD, etc.). Useful as agent *rules*,
but it does **not** define the ADR/context convention. `skills` is the one we want.

Install (for reference only): `npx skills@latest add mattpocock/skills`.

## 2. Directory structure & conventions (exact)

**Single-context layout (what we use):**

```
/
├── CONTEXT.md                  ← domain glossary (root)
├── CLAUDE.md  or  AGENTS.md    ← one canonical agent entry file
├── docs/
│   ├── adr/                    ← ADRs, created lazily
│   │   ├── 0001-slug.md
│   │   └── 0002-slug.md
│   └── agents/                 ← per-repo agent operating config
│       ├── domain.md
│       └── ...
└── src/
```

**Multi-context (monorepo) variant** — `CONTEXT-MAP.md` at root listing contexts, with
per-context `CONTEXT.md` and `docs/adr/` inside each `src/<context>/`. Not needed yet.

Key conventions (verbatim from the source):

- **ADRs live in `docs/adr/`**, sequential `0001-slug.md`. Next number = highest + 1.
- **Directories are created lazily** — only when there's something real to write. Don't
  scaffold empty folders.
- **AI context is split into three kinds of knowledge:**
  - `CONTEXT.md` — domain **glossary only** (ubiquitous language). *"Totally devoid of
    implementation details… a glossary and nothing else."*
  - `docs/adr/` — architectural **decisions**.
  - `docs/agents/*.md` — operational **config** for agents.
- **`CLAUDE.md` vs `AGENTS.md`:** edit whichever exists; never create both alongside
  each other. (We've chosen `AGENTS.md` as canonical for cross-platform reasons, with
  `CLAUDE.md` as a thin pointer — a deliberate, documented divergence.)

## 3. The ADR format (his variant — deliberately minimal)

This is the most distinctive part and where he diverges sharply from Nygard/MADR. An
ADR is **one title + 1–3 sentences**. Verbatim from `ADR-FORMAT.md`:

```md
# {Short title of the decision}

{1-3 sentences: what's the context, what did we decide, and why.}
```

> *"That's it. An ADR can be a single paragraph. The value is in recording* that *a
> decision was made and* why *— not in filling out sections."*

**Optional sections, only when they add value** (most ADRs won't need them):
- `Status` frontmatter: `proposed | accepted | deprecated | superseded by ADR-NNNN`
- `Considered Options` — only when rejected alternatives are worth remembering
- `Consequences` — only when non-obvious downstream effects matter

**Write an ADR only when all three are true:**
1. **Hard to reverse**
2. **Surprising without context** (future reader asks "why on earth did they do this?")
3. **The result of a real trade-off** (genuine alternatives existed)

**CONTEXT.md (glossary) format**, verbatim:
```md
# {Context Name}

{One or two sentence description of what this context is and why it exists.}

## Language

**Order**:
{One or two sentence description of the term}
_Avoid_: Purchase, transaction
```
Rules: be opinionated (one term, synonyms under `_Avoid_`); tight definitions (1–2
sentences, what it IS not what it does); only project-specific domain terms.

## 4. Tooling

Deliberately **none** — no `log4brains`, `adr-tools`, or `madr`. Management is done by
the agent: it scans `docs/adr/` for the highest number and increments. We follow suit:
ADRs are just markdown files we (or an agent) write directly.

## 5. His philosophy for AI-agent-friendly repos

- **Small, composable, model-agnostic primitives** over monolithic process frameworks.
- **Record decisions, not ceremony** — bias toward *not* writing an ADR unless it's
  hard-to-reverse + surprising + a real trade-off.
- **Separate the three kinds of knowledge:** glossary (`CONTEXT.md`), decisions
  (`docs/adr/`), agent config (`docs/agents/`).
- **Lazy creation / progressive disclosure** — don't scaffold empty dirs; if domain
  docs are absent, proceed silently rather than nag.
- **Glossary discipline = token efficiency + naming consistency.**
- **One canonical agent entry file** that points to detailed `docs/agents/*` files.

## 6. How we're applying this here

- `AGENTS.md` is our canonical agent entry file; `CLAUDE.md` is a thin pointer to it
  (cross-platform goal). This is a deliberate divergence from "edit whichever exists."
- `CONTEXT.md` holds our recipe-domain glossary (Recipe, Ingredient, Yield, Variation,
  Contributor, etc.) — created once we have real terms.
- `docs/adr/` holds decisions (data format, framework, hosting, photo handling, intake
  workflow), using his minimal one-paragraph format, numbered `NNNN-slug.md`.
- `docs/agents/` holds operating config (e.g. `intake.md` for the email→recipe flow,
  `domain.md` consumer rules) — created lazily as needed.

## Industry-standard equivalents (for reference / if we ever want more rigor)

- Michael Nygard's original ADR (Status/Context/Decision/Consequences) —
  <https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions>
- joelparkerhenderson/architecture-decision-record (de-facto reference templates) —
  <https://github.com/joelparkerhenderson/architecture-decision-record>
- adr.github.io (ADR org + tooling index) — <https://adr.github.io>
- MADR — Markdown Any Decision Records — <https://adr.github.io/madr/>
- AGENTS.md open standard — <https://agents.md>

A sensible hybrid if we outgrow the minimal format: keep his `docs/adr/NNNN-slug.md`
location, numbering, and "write sparingly" rule, but adopt the Nygard/MADR four-section
body for genuinely weighty decisions.

---

## Sources
- <https://github.com/mattpocock/skills> — canonical repo
- ADR-FORMAT.md: <https://github.com/mattpocock/skills/blob/main/skills/engineering/domain-modeling/ADR-FORMAT.md>
- CONTEXT-FORMAT.md: <https://github.com/mattpocock/skills/blob/main/skills/engineering/domain-modeling/CONTEXT-FORMAT.md>
- domain-modeling/SKILL.md: <https://github.com/mattpocock/skills/blob/main/skills/engineering/domain-modeling/SKILL.md>
- setup-matt-pocock-skills/SKILL.md: <https://github.com/mattpocock/skills/blob/main/skills/engineering/setup-matt-pocock-skills/SKILL.md>
- Example ADR 0001: <https://github.com/mattpocock/skills/blob/main/docs/adr/0001-explicit-setup-pointer-only-for-hard-dependencies.md>
- <https://github.com/mattpocock/agent-rules-books> · <https://agents.md> · <https://adr.github.io/madr/>
