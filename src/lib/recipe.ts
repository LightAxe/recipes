import type { CollectionEntry } from 'astro:content';

type Recipe = CollectionEntry<'recipes'>;
type Ingredient = Recipe['data']['ingredients'][number];

/** Group ingredients by their optional `section`, preserving first-seen order. */
export function groupIngredients(items: Ingredient[]) {
  const groups: { section: string; items: Ingredient[] }[] = [];
  for (const it of items) {
    const sec = it.section ?? '';
    let g = groups.find((x) => x.section === sec);
    if (!g) {
      g = { section: sec, items: [] };
      groups.push(g);
    }
    g.items.push(it);
  }
  return groups;
}

/** Normalize the string | object instruction union to objects. */
export function normalizeSteps(instructions: Recipe['data']['instructions']) {
  return instructions.map((s) => (typeof s === 'string' ? { text: s, timer: undefined } : s));
}

/** "≈ 150 g" / "150 g" / null. */
export function gramLabel(i: Ingredient): string | null {
  if (!i.grams) return null;
  return `${i.gramsApprox ? '≈ ' : ''}${i.grams} g`;
}
