// Browse-layer glue: pull the recipe collection through the shared `termIndex`
// (src/lib/taxonomy.ts) and expose the per-axis static paths + sort helpers that the
// taxonomy routes, the home tiles, and the /recipes/ facet grid all share.
import { getCollection, type CollectionEntry } from 'astro:content';
import { termIndex, type Axis, type RecipeFacets } from './taxonomy';

export type Recipe = CollectionEntry<'recipes'>;

const facets = (r: Recipe): RecipeFacets => ({
  course: r.data.course,
  tags: r.data.tags,
  cuisine: r.data.cuisine,
  contributor: r.data.contributor,
});

export const byTitle = (a: Recipe, b: Recipe) => a.data.title.localeCompare(b.data.title);

export const byNewest = (a: Recipe, b: Recipe) => {
  const ad = a.data.datePublished?.getTime() ?? 0;
  const bd = b.data.datePublished?.getTime() ?? 0;
  // Newest first; recipes with no date sort last, tiebroken A–Z (deterministic build).
  return bd - ad || byTitle(a, b);
};

export async function allRecipes(): Promise<Recipe[]> {
  return getCollection('recipes');
}

export async function taxonomyIndex() {
  return termIndex(await allRecipes(), facets);
}

/** getStaticPaths entries for one axis: { params:{slug}, props:{axis,label,recipes} }. */
export async function taxonomyPaths(axis: Axis) {
  const idx = await taxonomyIndex();
  return [...idx[axis].values()].map((term) => ({
    params: { slug: term.slug },
    props: { axis: term.axis, label: term.label, recipes: [...term.items].sort(byTitle) },
  }));
}
