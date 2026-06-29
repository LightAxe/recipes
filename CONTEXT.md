# Family Recipes

The shared vocabulary for our family recipe collection. Use these exact terms in code,
content, and discussion so everything stays consistent. Glossary only — no
implementation details. (See `AGENTS.md` for what we're building, `docs/adr/` for
decisions.)

## Language

**Recipe**:
A single dish with its ingredients, steps, and metadata — the core unit of the
collection.
_Avoid_: post, article, entry

**Ingredient**:
One line item used in a recipe (quantity + item), e.g. "3 cups flour".
_Avoid_: item, component

**Step**:
One instruction in the method of a recipe.
_Avoid_: direction, task

**Yield**:
How much a recipe makes (servings or quantity), e.g. "8 servings", "2 dozen".
_Avoid_: serves, portions, makes

**Variation**:
A documented family alternative to a recipe ("Aunt May uses honey instead of sugar"),
attributed to a person. Preserves family lore without replacing the base Recipe.
_Avoid_: version, fork, alternative

**Note**:
A free-form tip or memory attached to a recipe ("Grandma always added a pinch more
nutmeg"). Distinct from a Variation, which changes the recipe.
_Avoid_: comment, remark

**Contributor**:
A family member credited with a Recipe, Variation, or Note.
_Avoid_: author, user, member

**Tip** (a.k.a. cooking tip):
Standalone technique/reference content not tied to one recipe (e.g. "how to knead
dough", conversion charts). Lives alongside recipes.
_Avoid_: guide, how-to, article

**Collection**:
The whole body of family recipes plus tips — the website as a whole.
_Avoid_: cookbook, site, blog

**Intake**:
The process of turning an emailed recipe submission into a published Recipe.
_Avoid_: submission flow, ingestion, import
